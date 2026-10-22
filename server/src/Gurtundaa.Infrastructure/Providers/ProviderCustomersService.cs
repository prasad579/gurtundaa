using System.Security.Cryptography;
using Gurtundaa.Application.Common;
using Gurtundaa.Application.Providers;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Providers;

public class ProviderCustomersService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IProviderCustomersService
{
    private const string CodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private IQueryable<ProviderCustomer> Mine =>
        db.ProviderCustomers.Where(c => c.ProviderUserId == currentUser.UserId && c.ArchivedAt == null);

    public async Task<IReadOnlyList<ProviderManualCustomerDto>> ListAsync(CancellationToken ct) =>
        await Mine.AsNoTracking()
            .Include(c => c.ClaimedByUser)
            .OrderBy(c => c.Name)
            .Select(c => ToDto(c))
            .ToListAsync(ct);

    public async Task<ProviderManualCustomerDto> CreateAsync(SaveProviderManualCustomerRequest request, CancellationToken ct)
    {
        var category = CategoryForCurrentProvider();
        var customer = new ProviderCustomer
        {
            ProviderUserId = currentUser.UserId,
            Category = category,
            Name = request.Name.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim(),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            DefaultQuantityLtr = request.DefaultQuantityLtr,
            DefaultRatePerLtr = request.DefaultRatePerLtr,
            DefaultSlot = request.DefaultSlot,
            DefaultVariety = string.IsNullOrWhiteSpace(request.DefaultVariety) ? null : request.DefaultVariety.Trim(),
            CreatedAt = clock.GetUtcNow(),
        };

        db.ProviderCustomers.Add(customer);
        await db.SaveChangesAsync(ct);
        return ToDto(customer);
    }

    public async Task<ProviderManualCustomerDto?> UpdateAsync(Guid id, SaveProviderManualCustomerRequest request, CancellationToken ct)
    {
        var customer = await Mine.SingleOrDefaultAsync(c => c.Id == id, ct);
        if (customer is null)
        {
            return null;
        }

        customer.Name = request.Name.Trim();
        customer.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        customer.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        customer.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        customer.DefaultQuantityLtr = request.DefaultQuantityLtr;
        customer.DefaultRatePerLtr = request.DefaultRatePerLtr;
        customer.DefaultSlot = request.DefaultSlot;
        customer.DefaultVariety = string.IsNullOrWhiteSpace(request.DefaultVariety) ? null : request.DefaultVariety.Trim();
        await db.SaveChangesAsync(ct);
        return ToDto(customer);
    }

    public async Task<bool> ArchiveAsync(Guid id, CancellationToken ct) =>
        await Mine.Where(c => c.Id == id).ExecuteUpdateAsync(c => c.SetProperty(x => x.ArchivedAt, clock.GetUtcNow()), ct) > 0;

    public async Task<ProviderManualCustomerDto?> GenerateLinkCodeAsync(Guid id, CancellationToken ct)
    {
        var customer = await Mine.SingleOrDefaultAsync(c => c.Id == id, ct);
        if (customer is null)
        {
            return null;
        }

        if (customer.LinkCode is null)
        {
            customer.LinkCode = await GenerateUniqueCodeAsync(ct);
            await db.SaveChangesAsync(ct);
        }

        return ToDto(customer);
    }

    public async Task<Result<ProviderManualCustomerDto>> ClaimAsync(ClaimProviderCustomerRequest request, CancellationToken ct)
    {
        var code = request.LinkCode.Trim().ToUpperInvariant();
        var customer = await db.ProviderCustomers
            .SingleOrDefaultAsync(c => c.LinkCode == code && c.ArchivedAt == null, ct);
        if (customer is null)
        {
            return Result<ProviderManualCustomerDto>.Fail("That code is invalid.");
        }

        if (customer.ClaimedByUserId is not null && customer.ClaimedByUserId != currentUser.UserId)
        {
            return Result<ProviderManualCustomerDto>.Fail("That code has already been claimed.");
        }

        customer.ClaimedByUserId = currentUser.UserId;
        await db.SaveChangesAsync(ct);

        var withClaimant = await db.ProviderCustomers.AsNoTracking()
            .Include(c => c.ClaimedByUser)
            .SingleAsync(c => c.Id == customer.Id, ct);
        return Result<ProviderManualCustomerDto>.Ok(ToDto(withClaimant));
    }

    private ServiceContactCategory CategoryForCurrentProvider() => currentUser.UserType switch
    {
        UserType.MilkProvider => ServiceContactCategory.Milk,
        UserType.LaundryProvider => ServiceContactCategory.Laundry,
        _ => throw new UnauthorizedAccessException("Only providers manage manual customers."),
    };

    private async Task<string> GenerateUniqueCodeAsync(CancellationToken ct)
    {
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var code = $"GRV-{RandomString(4)}";
            if (!await db.ProviderCustomers.AnyAsync(c => c.LinkCode == code, ct))
            {
                return code;
            }
        }

        throw new InvalidOperationException("Could not generate a unique link code.");
    }

    private static string RandomString(int length) =>
        new(Enumerable.Range(0, length).Select(_ => CodeAlphabet[RandomNumberGenerator.GetInt32(CodeAlphabet.Length)]).ToArray());

    private static ProviderManualCustomerDto ToDto(ProviderCustomer c) => new(
        c.Id, c.Name, c.Phone, c.Address, c.Notes,
        c.DefaultQuantityLtr, c.DefaultRatePerLtr, c.DefaultSlot, c.DefaultVariety, c.LinkCode,
        c.ClaimedByUserId is not null, c.ClaimedByUser?.DisplayName, c.CreatedAt);
}
