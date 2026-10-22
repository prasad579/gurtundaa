using System.Security.Cryptography;
using Gurtundaa.Application.Common;
using Gurtundaa.Application.Providers;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Providers;

public class ProviderLinkService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IProviderLinkService
{
    private const string CodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I — easy to read aloud/copy

    public async Task<ProviderLinkDto?> GetForContactAsync(Guid serviceContactId, CancellationToken ct)
    {
        var link = await db.ProviderLinks.AsNoTracking()
            .Where(l => l.HouseholdUserId == currentUser.UserId && l.ServiceContactId == serviceContactId && l.RevokedAt == null)
            .OrderByDescending(l => l.CreatedAt)
            .FirstOrDefaultAsync(ct);

        return link is null ? null : await ToDtoAsync(link, ct);
    }

    public async Task<ProviderLinkDto?> CreateInviteAsync(CreateProviderInviteRequest request, CancellationToken ct)
    {
        var contact = await db.ServiceContacts.AsNoTracking()
            .SingleOrDefaultAsync(c => c.Id == request.ServiceContactId && c.UserId == currentUser.UserId, ct);
        if (contact is null)
        {
            return null;
        }

        var existing = await db.ProviderLinks
            .Where(l => l.HouseholdUserId == currentUser.UserId && l.ServiceContactId == request.ServiceContactId && l.RevokedAt == null)
            .OrderByDescending(l => l.CreatedAt)
            .FirstOrDefaultAsync(ct);
        if (existing is not null)
        {
            return await ToDtoAsync(existing, ct);
        }

        var link = new ProviderLink
        {
            HouseholdUserId = currentUser.UserId,
            ServiceContactId = request.ServiceContactId,
            Category = contact.Category,
            InviteCode = await GenerateUniqueCodeAsync(ct),
            CreatedAt = clock.GetUtcNow(),
        };
        db.ProviderLinks.Add(link);
        await db.SaveChangesAsync(ct);

        return await ToDtoAsync(link, ct);
    }

    public async Task<bool> RevokeAsync(Guid id, CancellationToken ct)
    {
        var link = await db.ProviderLinks
            .SingleOrDefaultAsync(l => l.Id == id && l.HouseholdUserId == currentUser.UserId && l.RevokedAt == null, ct);
        if (link is null)
        {
            return false;
        }

        link.RevokedAt = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<Result<ProviderLinkDto>> ClaimAsync(ClaimProviderInviteRequest request, CancellationToken ct)
    {
        var code = request.InviteCode.Trim().ToUpperInvariant();
        var link = await db.ProviderLinks
            .SingleOrDefaultAsync(l => l.InviteCode == code && l.RevokedAt == null && l.ProviderUserId == null, ct);
        if (link is null)
        {
            return Result<ProviderLinkDto>.Fail("That code is invalid or has already been used.");
        }

        var expectedType = link.Category switch
        {
            ServiceContactCategory.Milk => UserType.MilkProvider,
            ServiceContactCategory.Laundry => UserType.LaundryProvider,
            _ => (UserType?)null,
        };
        if (expectedType is null || currentUser.UserType != expectedType)
        {
            return Result<ProviderLinkDto>.Fail("This code isn't for your provider type.");
        }

        if (link.HouseholdUserId == currentUser.UserId)
        {
            return Result<ProviderLinkDto>.Fail("You can't link to your own household.");
        }

        link.ProviderUserId = currentUser.UserId;
        link.ClaimedAt = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);

        return Result<ProviderLinkDto>.Ok(await ToDtoAsync(link, ct));
    }

    private async Task<ProviderLinkDto> ToDtoAsync(ProviderLink link, CancellationToken ct)
    {
        var contactName = await db.ServiceContacts.AsNoTracking()
            .Where(c => c.Id == link.ServiceContactId)
            .Select(c => c.Name)
            .SingleOrDefaultAsync(ct) ?? "";

        string? providerName = null;
        if (link.ProviderUserId is { } providerId)
        {
            providerName = await db.Users.AsNoTracking()
                .Where(u => u.Id == providerId)
                .Select(u => u.DisplayName)
                .SingleOrDefaultAsync(ct);
        }

        return new ProviderLinkDto(
            link.Id,
            link.ServiceContactId,
            contactName,
            link.Category,
            link.InviteCode,
            link.ProviderUserId is not null,
            providerName,
            link.CreatedAt,
            link.ClaimedAt);
    }

    private async Task<string> GenerateUniqueCodeAsync(CancellationToken ct)
    {
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var code = $"GRT-{RandomString(4)}";
            if (!await db.ProviderLinks.AnyAsync(l => l.InviteCode == code, ct))
            {
                return code;
            }
        }

        throw new InvalidOperationException("Could not generate a unique invite code.");
    }

    private static string RandomString(int length) =>
        new(Enumerable.Range(0, length).Select(_ => CodeAlphabet[RandomNumberGenerator.GetInt32(CodeAlphabet.Length)]).ToArray());
}
