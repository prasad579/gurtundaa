using Gurtundaa.Application.Common;
using Gurtundaa.Application.Milk;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Milk;

public class MilkActivityService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IMilkActivityService
{
    public async Task<IReadOnlyList<MilkActivityItemDto>> GetRecentAsync(int take, CancellationToken ct)
    {
        var userId = currentUser.UserId;

        var missed = await db.MilkDeliveryOverrides.AsNoTracking()
            .Where(o => o.UserId == userId && o.Status == MilkDeliveryStatus.Missed)
            .Select(o => new MilkActivityItemDto(
                MilkActivityType.Missed,
                o.Slot == MilkSlot.Evening ? "Marked as Not Delivered (Evening)" : "Marked as Not Delivered (Morning)",
                o.Date, null, o.CreatedAt, o.AddedByProvider!.DisplayName))
            .ToListAsync(ct);

        var extras = await db.MilkExtraRequests.AsNoTracking()
            .Where(e => e.UserId == userId)
            .Select(e => new MilkActivityItemDto(
                MilkActivityType.ExtraAdded,
                e.Slot == MilkSlot.Evening ? "Extra Milk Added (Evening)" : "Extra Milk Added (Morning)",
                e.Date, e.QuantityLtr, e.CreatedAt, e.AddedByProvider!.DisplayName))
            .ToListAsync(ct);

        var pauses = await db.MilkPauses.AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => new MilkActivityItemDto(MilkActivityType.Paused, "Delivery Paused", p.StartDate, null, p.CreatedAt))
            .ToListAsync(ct);

        return missed.Concat(extras).Concat(pauses)
            .OrderByDescending(a => a.OccurredAt)
            .Take(take)
            .ToList();
    }

    public async Task<int> GetUnseenProviderActivityCountAsync(CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var unseenOverrides = await db.MilkDeliveryOverrides.AsNoTracking()
            .CountAsync(o => o.UserId == userId && o.AddedByProviderId != null && o.SeenByHouseholdAt == null, ct);
        var unseenExtras = await db.MilkExtraRequests.AsNoTracking()
            .CountAsync(e => e.UserId == userId && e.AddedByProviderId != null && e.SeenByHouseholdAt == null, ct);
        return unseenOverrides + unseenExtras;
    }

    public async Task MarkProviderActivitySeenAsync(CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var now = clock.GetUtcNow();

        await db.MilkDeliveryOverrides
            .Where(o => o.UserId == userId && o.AddedByProviderId != null && o.SeenByHouseholdAt == null)
            .ExecuteUpdateAsync(o => o.SetProperty(x => x.SeenByHouseholdAt, now), ct);

        await db.MilkExtraRequests
            .Where(e => e.UserId == userId && e.AddedByProviderId != null && e.SeenByHouseholdAt == null)
            .ExecuteUpdateAsync(e => e.SetProperty(x => x.SeenByHouseholdAt, now), ct);
    }
}
