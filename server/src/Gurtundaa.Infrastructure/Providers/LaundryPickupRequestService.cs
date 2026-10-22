using Gurtundaa.Application.Common;
using Gurtundaa.Application.Providers;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Providers;

public class LaundryPickupRequestService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : ILaundryPickupRequestService
{
    public async Task<Result<LaundryPickupRequestDto>> CreateAsync(CreatePickupRequestRequest request, CancellationToken ct)
    {
        var link = await db.ProviderLinks.AsNoTracking()
            .SingleOrDefaultAsync(l => l.HouseholdUserId == currentUser.UserId && l.ServiceContactId == request.ServiceContactId
                && l.Category == ServiceContactCategory.Laundry && l.ProviderUserId != null && l.RevokedAt == null, ct);
        if (link is null)
        {
            return Result<LaundryPickupRequestDto>.Fail("This contact hasn't joined as a provider yet — message them directly instead.");
        }

        var householdName = await db.Users.AsNoTracking()
            .Where(u => u.Id == currentUser.UserId).Select(u => u.DisplayName).SingleAsync(ct);

        var pickupRequest = new LaundryPickupRequest
        {
            HouseholdUserId = currentUser.UserId,
            ProviderUserId = link.ProviderUserId!.Value,
            RequestedDate = request.RequestedDate,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            CreatedAt = clock.GetUtcNow(),
        };

        db.LaundryPickupRequests.Add(pickupRequest);
        await db.SaveChangesAsync(ct);

        return Result<LaundryPickupRequestDto>.Ok(new LaundryPickupRequestDto(
            pickupRequest.Id, pickupRequest.HouseholdUserId, householdName,
            pickupRequest.RequestedDate, pickupRequest.Note, pickupRequest.CreatedAt, false));
    }

    public async Task<IReadOnlyList<LaundryPickupRequestDto>> ListPendingForProviderAsync(CancellationToken ct)
    {
        var requests = await db.LaundryPickupRequests.AsNoTracking()
            .Where(r => r.ProviderUserId == currentUser.UserId && r.HandledAt == null)
            .OrderBy(r => r.RequestedDate)
            .ToListAsync(ct);

        var householdIds = requests.Select(r => r.HouseholdUserId).Distinct().ToList();
        var names = await db.Users.AsNoTracking()
            .Where(u => householdIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.DisplayName, ct);

        return requests
            .Select(r => new LaundryPickupRequestDto(
                r.Id, r.HouseholdUserId, names.GetValueOrDefault(r.HouseholdUserId, ""),
                r.RequestedDate, r.Note, r.CreatedAt, false))
            .ToList();
    }

    public async Task<bool> MarkHandledAsync(Guid id, CancellationToken ct) =>
        await db.LaundryPickupRequests
            .Where(r => r.Id == id && r.ProviderUserId == currentUser.UserId && r.HandledAt == null)
            .ExecuteUpdateAsync(r => r.SetProperty(x => x.HandledAt, clock.GetUtcNow()), ct) > 0;
}
