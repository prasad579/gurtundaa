using System.Text.Json;
using Gurtundaa.Application.Common;
using Gurtundaa.Application.Laundry;
using Gurtundaa.Application.Milk;
using Gurtundaa.Application.Providers;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Milk;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Providers;

public class ProviderDashboardService(AppDbContext db, ICurrentUser currentUser, IMilkDeliveryService milkDeliveries, TimeProvider clock)
    : IProviderDashboardService
{
    public async Task<ProviderLaundryDashboardDto> GetLaundryDashboardAsync(CancellationToken ct)
    {
        var (contactToHousehold, households) = await LinkedContactsAsync(ServiceContactCategory.Laundry, ct);
        var contactIds = contactToHousehold.Keys.ToList();
        var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);
        var monthStart = new DateOnly(today.Year, today.Month, 1);

        var batches = await db.LaundryBatches.AsNoTracking()
            .Where(b => b.ContactId != null && contactIds.Contains(b.ContactId!.Value))
            .ToListAsync(ct);

        var givenToday = batches.Where(b => b.GivenOn == today).ToList();
        var gaveToday = givenToday.Select(b =>
        {
            var householdId = contactToHousehold[b.ContactId!.Value];
            return new ProviderLaundryTodayItemDto(
                householdId,
                households.GetValueOrDefault(householdId)?.Name ?? "",
                b.Id,
                ItemsSummary(b),
                ItemCount(b),
                BatchAmount(b),
                b.IsPaid);
        }).ToList();

        var thisMonth = batches.Where(b => b.GivenOn >= monthStart && b.GivenOn <= today).ToList();

        var customers = contactToHousehold.Values.Distinct()
            .Where(households.ContainsKey)
            .Select(id => new ProviderCustomerDto(id, households[id]!.Name, households[id]!.City, households[id]!.Phone, households[id]!.LinkedAt))
            .OrderBy(c => c.HouseholdName)
            .ToList();

        return new ProviderLaundryDashboardDto(
            CustomersToday: gaveToday.Select(i => i.HouseholdUserId).Distinct().Count(),
            ItemsGivenToday: givenToday.Sum(ItemCount),
            ExpectedToday: givenToday.Sum(b => BatchAmount(b) ?? 0),
            GaveToday: gaveToday,
            ReceivedThisMonth: thisMonth.Where(b => b.IsPaid).Sum(b => BatchAmount(b) ?? 0),
            PendingThisMonth: thisMonth.Where(b => !b.IsPaid).Sum(b => BatchAmount(b) ?? 0),
            Customers: customers);
    }

    public async Task<ProviderLaundryCustomerDetailDto?> GetLaundryCustomerAsync(Guid householdUserId, CancellationToken ct)
    {
        var contactIds = await LinkedContactIdsForHouseholdAsync(householdUserId, ServiceContactCategory.Laundry, ct);
        if (contactIds.Count == 0)
        {
            return null;
        }

        var household = await HouseholdInfoAsync(householdUserId, ct);
        if (household is null)
        {
            return null;
        }

        var batches = await db.LaundryBatches.AsNoTracking()
            .Include(b => b.Contact)
            .Where(b => b.ContactId != null && contactIds.Contains(b.ContactId!.Value))
            .ToListAsync(ct);

        var active = batches.Where(b => b.Status == LaundryBatchStatus.Active)
            .OrderByDescending(b => b.GivenOn).Select(ToLaundryDto).ToList();
        var history = batches.Where(b => b.Status == LaundryBatchStatus.PickedUp)
            .OrderByDescending(b => b.PickedUpOn).Select(ToLaundryDto).ToList();

        return new ProviderLaundryCustomerDetailDto(householdUserId, household.Value.Name, household.Value.City, active, history);
    }

    public async Task<ProviderMilkDashboardDto> GetMilkDashboardAsync(CancellationToken ct)
    {
        var (_, households) = await LinkedContactsAsync(ServiceContactCategory.Milk, ct);
        var householdIds = households.Keys.ToList();
        var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);

        var subscriptions = await db.MilkSubscriptions.AsNoTracking()
            .Where(s => householdIds.Contains(s.UserId))
            .ToDictionaryAsync(s => s.UserId, ct);

        var pauses = (await db.MilkPauses.AsNoTracking()
            .Where(p => householdIds.Contains(p.UserId) && p.StartDate <= today && p.EndDate >= today)
            .ToListAsync(ct))
            .GroupBy(p => p.UserId).ToDictionary(g => g.Key, g => (IReadOnlyCollection<MilkPause>)g.ToList());

        var overrides = (await db.MilkDeliveryOverrides.AsNoTracking()
            .Where(o => householdIds.Contains(o.UserId) && o.Date == today)
            .ToListAsync(ct))
            .GroupBy(o => o.UserId).ToDictionary(g => g.Key, g => (IReadOnlyCollection<MilkDeliveryOverride>)g.ToList());

        var changes = (await db.MilkQuantityChanges.AsNoTracking()
            .Where(q => householdIds.Contains(q.UserId) && q.StartDate <= today && q.EndDate >= today)
            .ToListAsync(ct))
            .GroupBy(q => q.UserId).ToDictionary(g => g.Key, g => (IReadOnlyCollection<MilkQuantityChange>)g.ToList());

        var extras = (await db.MilkExtraRequests.AsNoTracking()
            .Where(e => householdIds.Contains(e.UserId) && e.Date == today)
            .Select(e => new { e.UserId, e.Slot })
            .ToListAsync(ct))
            .GroupBy(e => e.UserId).ToDictionary(g => g.Key, g => g.Select(e => e.Slot).ToHashSet());

        var deliverToday = new List<ProviderMilkTodayItemDto>();
        decimal plannedLitres = 0, deliveredLitres = 0, expectedToday = 0, receivedThisMonth = 0, pendingThisMonth = 0, totalLitresThisMonth = 0;
        int deliveredCount = 0, pausedCount = 0, missedCount = 0, increasedCount = 0, decreasedCount = 0;
        int deliveredDaysThisMonth = 0, pausedDaysThisMonth = 0, missedDaysThisMonth = 0;

        foreach (var householdId in householdIds)
        {
            if (!households.TryGetValue(householdId, out var info))
            {
                continue;
            }

            subscriptions.TryGetValue(householdId, out var subscription);
            var hasExtra = extras.GetValueOrDefault(householdId, []);

            var morning = MilkDeliveryCalculator.ResolveSlot(MilkSlot.Morning, today, subscription,
                pauses.GetValueOrDefault(householdId, []), overrides.GetValueOrDefault(householdId, []),
                changes.GetValueOrDefault(householdId, []), hasExtra.Contains(MilkSlot.Morning));
            var evening = MilkDeliveryCalculator.ResolveSlot(MilkSlot.Evening, today, subscription,
                pauses.GetValueOrDefault(householdId, []), overrides.GetValueOrDefault(householdId, []),
                changes.GetValueOrDefault(householdId, []), hasExtra.Contains(MilkSlot.Evening));

            if (!morning.Enabled && !evening.Enabled)
            {
                continue; // no active subscription set up yet
            }

            var status = MilkDeliveryCalculator.CombineStatus(morning, evening);
            var quantity = status == MilkCalendarStatus.Delivered
                ? (morning.Enabled ? morning.QuantityLtr : 0) + (evening.Enabled ? evening.QuantityLtr : 0)
                : 0;
            var amount = quantity * (subscription?.RatePerLtr ?? 0);

            // "Planned" is the subscription's normal daily total, independent of today's pause/
            // override/quantity-change — it answers "how much was this customer supposed to get"
            // regardless of what actually happened today.
            var baseQuantity = (morning.Enabled ? subscription?.MorningQuantityLtr ?? 0 : 0) + (evening.Enabled ? subscription?.EveningQuantityLtr ?? 0 : 0);
            plannedLitres += baseQuantity;

            switch (status)
            {
                case MilkCalendarStatus.Delivered:
                    deliveredCount++;
                    deliveredLitres += quantity;
                    expectedToday += amount;
                    if (quantity > baseQuantity) increasedCount++;
                    else if (quantity < baseQuantity) decreasedCount++;
                    break;
                case MilkCalendarStatus.Paused: pausedCount++; break;
                case MilkCalendarStatus.Missed: missedCount++; break;
            }

            deliverToday.Add(new ProviderMilkTodayItemDto(householdId, info.Name, quantity, amount, status));

            var monthSummary = (await milkDeliveries.GetMonthForUserAsync(householdId, today.Year, today.Month, ct)).Summary;
            if (monthSummary.IsPaid)
            {
                receivedThisMonth += monthSummary.TotalAmount;
            }
            else
            {
                pendingThisMonth += monthSummary.TotalAmount;
            }

            totalLitresThisMonth += monthSummary.RegularLitres + monthSummary.ExtraLitres;
            deliveredDaysThisMonth += monthSummary.Delivered;
            pausedDaysThisMonth += monthSummary.Paused;
            missedDaysThisMonth += monthSummary.Missed;
        }

        var customers = households
            .Select(kvp => new ProviderCustomerDto(kvp.Key, kvp.Value.Name, kvp.Value.City, kvp.Value.Phone, kvp.Value.LinkedAt))
            .OrderBy(c => c.HouseholdName)
            .ToList();

        return new ProviderMilkDashboardDto(
            ActiveCustomers: deliverToday.Count,
            DeliveredCustomers: deliveredCount,
            PausedCustomers: pausedCount,
            MissedCustomers: missedCount,
            IncreasedQuantityCustomers: increasedCount,
            DecreasedQuantityCustomers: decreasedCount,
            PlannedLitresToday: plannedLitres,
            TotalLitresToday: deliveredLitres,
            ExpectedToday: expectedToday,
            DeliverToday: deliverToday.OrderBy(i => i.HouseholdName).ToList(),
            TotalLitresThisMonth: totalLitresThisMonth,
            DeliveredDaysThisMonth: deliveredDaysThisMonth,
            PausedDaysThisMonth: pausedDaysThisMonth,
            MissedDaysThisMonth: missedDaysThisMonth,
            ExpectedThisMonth: receivedThisMonth + pendingThisMonth,
            ReceivedThisMonth: receivedThisMonth,
            PendingThisMonth: pendingThisMonth,
            Customers: customers);
    }

    public async Task<ProviderMilkCustomerDetailDto?> GetMilkCustomerAsync(Guid householdUserId, CancellationToken ct)
    {
        var linkedContactIds = await LinkedContactIdsForHouseholdAsync(householdUserId, ServiceContactCategory.Milk, ct);
        if (linkedContactIds.Count == 0)
        {
            return null;
        }

        var household = await HouseholdInfoAsync(householdUserId, ct);
        if (household is null)
        {
            return null;
        }

        var subscription = await db.MilkSubscriptions.AsNoTracking()
            .Include(s => s.Contact)
            .SingleOrDefaultAsync(s => s.UserId == householdUserId, ct);

        var subscriptionDto = subscription is null ? null : new MilkSubscriptionDto(
            subscription.ContactId, subscription.Contact?.Name, subscription.Contact?.Phone, subscription.IsSelfCollected,
            subscription.StartDate, subscription.MorningEnabled, subscription.MorningQuantityLtr,
            subscription.MorningWindowStart, subscription.MorningWindowEnd,
            subscription.EveningEnabled, subscription.EveningQuantityLtr,
            subscription.EveningWindowStart, subscription.EveningWindowEnd,
            subscription.RatePerLtr, subscription.SettlementCycle, subscription.UpdatedAt);

        return new ProviderMilkCustomerDetailDto(householdUserId, household.Value.Name, household.Value.City, subscriptionDto);
    }

    public async Task<MilkMonthDto?> GetMilkCustomerMonthAsync(Guid householdUserId, int year, int month, CancellationToken ct)
    {
        var linkedContactIds = await LinkedContactIdsForHouseholdAsync(householdUserId, ServiceContactCategory.Milk, ct);
        if (linkedContactIds.Count == 0)
        {
            return null;
        }

        return await milkDeliveries.GetMonthForUserAsync(householdUserId, year, month, ct);
    }

    private sealed record HouseholdInfo(string Name, string? City, string? Phone, DateTimeOffset LinkedAt);

    private async Task<(Guid HouseholdUserId, HouseholdInfo? Info)[]> ResolveHouseholdsAsync(IReadOnlyCollection<ProviderLink> links, CancellationToken ct)
    {
        var householdIds = links.Select(l => l.HouseholdUserId).Distinct().ToList();
        var users = await db.Users.AsNoTracking().Where(u => householdIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => new { u.DisplayName, u.PhoneNumber }, ct);
        var cities = await db.HouseholdProfiles.AsNoTracking().Where(p => householdIds.Contains(p.UserId)).ToDictionaryAsync(p => p.UserId, p => p.City, ct);

        return householdIds.Select(id => users.TryGetValue(id, out var user)
                ? (id, (HouseholdInfo?)new HouseholdInfo(user.DisplayName, cities.GetValueOrDefault(id), user.PhoneNumber,
                    links.Where(l => l.HouseholdUserId == id).Min(l => l.ClaimedAt) ?? links.Where(l => l.HouseholdUserId == id).Min(l => l.CreatedAt)))
                : (id, null))
            .ToArray();
    }

    private async Task<(Dictionary<Guid, Guid> ContactToHousehold, Dictionary<Guid, HouseholdInfo> Households)> LinkedContactsAsync(
        ServiceContactCategory category, CancellationToken ct)
    {
        var links = await db.ProviderLinks.AsNoTracking()
            .Where(l => l.ProviderUserId == currentUser.UserId && l.Category == category && l.RevokedAt == null)
            .ToListAsync(ct);

        var resolved = await ResolveHouseholdsAsync(links, ct);
        var households = resolved.Where(r => r.Info is not null).ToDictionary(r => r.HouseholdUserId, r => r.Info!);

        var contactToHousehold = links
            .Where(l => households.ContainsKey(l.HouseholdUserId))
            .ToDictionary(l => l.ServiceContactId, l => l.HouseholdUserId);

        return (contactToHousehold, households);
    }

    private async Task<List<Guid>> LinkedContactIdsForHouseholdAsync(Guid householdUserId, ServiceContactCategory category, CancellationToken ct) =>
        await db.ProviderLinks.AsNoTracking()
            .Where(l => l.ProviderUserId == currentUser.UserId && l.HouseholdUserId == householdUserId && l.Category == category && l.RevokedAt == null)
            .Select(l => l.ServiceContactId)
            .ToListAsync(ct);

    private async Task<(string Name, string? City)?> HouseholdInfoAsync(Guid householdUserId, CancellationToken ct)
    {
        var name = await db.Users.AsNoTracking().Where(u => u.Id == householdUserId).Select(u => u.DisplayName).SingleOrDefaultAsync(ct);
        if (name is null)
        {
            return null;
        }

        var city = await db.HouseholdProfiles.AsNoTracking().Where(p => p.UserId == householdUserId).Select(p => p.City).SingleOrDefaultAsync(ct);
        return (name, city);
    }

    private static decimal? BatchAmount(LaundryBatch batch)
    {
        if (batch.Amount is { } amount)
        {
            return amount;
        }

        var items = JsonSerializer.Deserialize<List<LaundryItemLine>>(batch.ItemsJson) ?? [];
        var estimated = items.Sum(i => i.Quantity * (i.PricePerItem ?? 0));
        return estimated > 0 ? estimated : null;
    }

    private static int ItemCount(LaundryBatch batch) =>
        (JsonSerializer.Deserialize<List<LaundryItemLine>>(batch.ItemsJson) ?? []).Sum(i => i.Quantity);

    private static string ItemsSummary(LaundryBatch batch)
    {
        var total = ItemCount(batch);
        return $"{total} item{(total == 1 ? "" : "s")}";
    }

    private static LaundryBatchDto ToLaundryDto(LaundryBatch batch)
    {
        var items = JsonSerializer.Deserialize<List<LaundryItemLine>>(batch.ItemsJson) ?? [];
        return new LaundryBatchDto(
            batch.Id, batch.ContactId, batch.Contact?.Name, batch.Contact?.Phone,
            batch.ServiceType, batch.GivenOn, batch.ExpectedReturn, batch.Status, batch.PickedUpOn,
            batch.Amount, batch.IsPaid, batch.PaidAt, items, batch.Notes, batch.CreatedAt);
    }
}
