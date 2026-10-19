using Gurtundaa.Application.Common;
using Gurtundaa.Application.Milk;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Milk;

public class MilkDeliveryService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IMilkDeliveryService
{
    public async Task<MilkMonthDto> GetMonthAsync(int year, int month, CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var subscription = await db.MilkSubscriptions.AsNoTracking().SingleOrDefaultAsync(s => s.UserId == userId, ct);

        var firstDay = new DateOnly(year, month, 1);
        var daysInMonth = DateTime.DaysInMonth(year, month);
        var lastDay = firstDay.AddDays(daysInMonth - 1);

        var pauses = await db.MilkPauses.AsNoTracking()
            .Where(p => p.UserId == userId && p.StartDate <= lastDay && p.EndDate >= firstDay)
            .ToListAsync(ct);

        var overrides = await db.MilkDeliveryOverrides.AsNoTracking()
            .Where(o => o.UserId == userId && o.Date >= firstDay && o.Date <= lastDay)
            .ToListAsync(ct);
        var overridesByDay = overrides.GroupBy(o => o.Date).ToDictionary(g => g.Key, g => g.ToList());

        var quantityChanges = await db.MilkQuantityChanges.AsNoTracking()
            .Where(q => q.UserId == userId && q.StartDate <= lastDay && q.EndDate >= firstDay)
            .ToListAsync(ct);

        var extras = await db.MilkExtraRequests.AsNoTracking()
            .Where(e => e.UserId == userId && e.Date >= firstDay && e.Date <= lastDay)
            .ToListAsync(ct);
        var extraSlotsByDay = extras.GroupBy(e => e.Date).ToDictionary(g => g.Key, g => g.Select(e => e.Slot).ToHashSet());

        var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);
        var startDate = subscription?.StartDate ?? firstDay;

        var days = new List<MilkCalendarDayDto>(daysInMonth);
        int delivered = 0, paused = 0, missed = 0;
        decimal regularLitres = 0;

        for (var date = firstDay; date <= lastDay; date = date.AddDays(1))
        {
            var dayOverrides = overridesByDay.GetValueOrDefault(date, []);
            var hasExtra = extraSlotsByDay.GetValueOrDefault(date, []);

            var morning = ResolveSlot(MilkSlot.Morning, date, subscription, pauses, dayOverrides, quantityChanges, hasExtra.Contains(MilkSlot.Morning));
            var evening = ResolveSlot(MilkSlot.Evening, date, subscription, pauses, dayOverrides, quantityChanges, hasExtra.Contains(MilkSlot.Evening));
            var dayStatus = CombineStatus(morning, evening);

            days.Add(new MilkCalendarDayDto(date, dayStatus, morning, evening));

            // Only count — and bill for — days that have actually happened: on/after the
            // subscription's start date (nothing is "delivered" before tracking began) and
            // on/before today (future days are still just a projection, not a fact yet).
            if (date < startDate || date > today)
            {
                continue;
            }

            switch (dayStatus)
            {
                case MilkCalendarStatus.Delivered: delivered++; break;
                case MilkCalendarStatus.Paused: paused++; break;
                case MilkCalendarStatus.Missed: missed++; break;
            }

            if (morning.Enabled && morning.Status == MilkCalendarStatus.Delivered) regularLitres += morning.QuantityLtr;
            if (evening.Enabled && evening.Status == MilkCalendarStatus.Delivered) regularLitres += evening.QuantityLtr;
        }

        var trackableFrom = startDate > firstDay ? startDate : firstDay;
        var trackableDays = Math.Max(0, (lastDay.DayNumber - trackableFrom.DayNumber) + 1);
        var extraLitres = extras.Where(e => e.Date >= startDate && e.Date <= today).Sum(e => e.QuantityLtr);
        var rate = subscription?.RatePerLtr ?? 0;
        var settlement = await db.MilkSettlements.AsNoTracking()
            .SingleOrDefaultAsync(s => s.UserId == userId && s.Year == year && s.Month == month, ct);

        var summary = new MilkMonthSummaryDto(
            trackableDays, delivered, paused, missed,
            regularLitres, extraLitres, rate,
            regularLitres * rate, extraLitres * rate, (regularLitres + extraLitres) * rate,
            settlement?.IsPaid ?? false, settlement?.PaidAt);

        return new MilkMonthDto(days, summary);
    }

    public async Task<MilkMonthSummaryDto> SetSettlementPaidAsync(int year, int month, SetMilkSettlementPaidRequest request, CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var settlement = await db.MilkSettlements.SingleOrDefaultAsync(s => s.UserId == userId && s.Year == year && s.Month == month, ct);
        if (settlement is null)
        {
            settlement = new MilkSettlement { UserId = userId, Year = year, Month = month };
            db.MilkSettlements.Add(settlement);
        }

        settlement.IsPaid = request.IsPaid;
        settlement.PaidAt = request.IsPaid ? clock.GetUtcNow() : null;
        await db.SaveChangesAsync(ct);

        var monthDto = await GetMonthAsync(year, month, ct);
        return monthDto.Summary;
    }

    public async Task<MilkTodayDto> GetTodayAsync(CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);

        var subscription = await db.MilkSubscriptions.AsNoTracking().SingleOrDefaultAsync(s => s.UserId == userId, ct);

        var pauses = await db.MilkPauses.AsNoTracking()
            .Where(p => p.UserId == userId && p.StartDate <= today && p.EndDate >= today)
            .ToListAsync(ct);

        var quantityChanges = await db.MilkQuantityChanges.AsNoTracking()
            .Where(q => q.UserId == userId && q.StartDate <= today && q.EndDate >= today)
            .ToListAsync(ct);

        var todaysOverrides = await db.MilkDeliveryOverrides.AsNoTracking()
            .Where(o => o.UserId == userId && o.Date == today)
            .ToListAsync(ct);

        var todaysExtraSlots = await db.MilkExtraRequests.AsNoTracking()
            .Where(e => e.UserId == userId && e.Date == today)
            .Select(e => e.Slot)
            .ToListAsync(ct);
        var hasExtra = todaysExtraSlots.ToHashSet();

        var morning = ResolveSlot(MilkSlot.Morning, today, subscription, pauses, todaysOverrides, quantityChanges, hasExtra.Contains(MilkSlot.Morning));
        var evening = ResolveSlot(MilkSlot.Evening, today, subscription, pauses, todaysOverrides, quantityChanges, hasExtra.Contains(MilkSlot.Evening));
        var isAuto = todaysOverrides.Count == 0;

        return new MilkTodayDto(today, morning, evening, isAuto);
    }

    public async Task<MilkTodayDto> SetOverrideAsync(DateOnly date, SetMilkDeliveryOverrideRequest request, CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var entity = await db.MilkDeliveryOverrides.SingleOrDefaultAsync(o => o.UserId == userId && o.Date == date && o.Slot == request.Slot, ct);
        if (entity is null)
        {
            entity = new MilkDeliveryOverride { UserId = userId, Date = date, Slot = request.Slot, CreatedAt = clock.GetUtcNow() };
            db.MilkDeliveryOverrides.Add(entity);
        }

        entity.Status = request.Status;
        entity.QuantityLtr = request.QuantityLtr;
        entity.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        await db.SaveChangesAsync(ct);

        var subscription = await db.MilkSubscriptions.AsNoTracking().SingleOrDefaultAsync(s => s.UserId == userId, ct);

        var pauses = await db.MilkPauses.AsNoTracking()
            .Where(p => p.UserId == userId && p.StartDate <= date && p.EndDate >= date)
            .ToListAsync(ct);

        var quantityChanges = await db.MilkQuantityChanges.AsNoTracking()
            .Where(q => q.UserId == userId && q.StartDate <= date && q.EndDate >= date)
            .ToListAsync(ct);

        var allOverridesForDate = await db.MilkDeliveryOverrides.AsNoTracking()
            .Where(o => o.UserId == userId && o.Date == date)
            .ToListAsync(ct);

        var hasExtraSlots = await db.MilkExtraRequests.AsNoTracking()
            .Where(e => e.UserId == userId && e.Date == date)
            .Select(e => e.Slot)
            .ToListAsync(ct);
        var hasExtra = hasExtraSlots.ToHashSet();

        var morning = ResolveSlot(MilkSlot.Morning, date, subscription, pauses, allOverridesForDate, quantityChanges, hasExtra.Contains(MilkSlot.Morning));
        var evening = ResolveSlot(MilkSlot.Evening, date, subscription, pauses, allOverridesForDate, quantityChanges, hasExtra.Contains(MilkSlot.Evening));
        return new MilkTodayDto(date, morning, evening, false);
    }

    private static MilkCalendarStatus CombineStatus(MilkSlotStateDto morning, MilkSlotStateDto evening)
    {
        if (morning.Enabled && morning.Status == MilkCalendarStatus.Paused) return MilkCalendarStatus.Paused;
        if (evening.Enabled && evening.Status == MilkCalendarStatus.Paused) return MilkCalendarStatus.Paused;
        if (morning.Enabled && morning.Status == MilkCalendarStatus.Missed) return MilkCalendarStatus.Missed;
        if (evening.Enabled && evening.Status == MilkCalendarStatus.Missed) return MilkCalendarStatus.Missed;
        return MilkCalendarStatus.Delivered;
    }

    private static MilkSlotStateDto ResolveSlot(
        MilkSlot slot,
        DateOnly date,
        MilkSubscription? subscription,
        IReadOnlyCollection<MilkPause> pauses,
        IReadOnlyCollection<MilkDeliveryOverride> overridesForScope,
        IReadOnlyCollection<MilkQuantityChange> quantityChanges,
        bool hasExtra)
    {
        var enabled = slot == MilkSlot.Morning ? subscription?.MorningEnabled ?? false : subscription?.EveningEnabled ?? false;
        var defaultQuantity = slot == MilkSlot.Morning ? subscription?.MorningQuantityLtr ?? 0m : subscription?.EveningQuantityLtr ?? 0m;

        if (!enabled)
        {
            return new MilkSlotStateDto(false, MilkCalendarStatus.Delivered, 0m, false);
        }

        if (pauses.Any(p => p.StartDate <= date && p.EndDate >= date))
        {
            return new MilkSlotStateDto(true, MilkCalendarStatus.Paused, 0m, hasExtra);
        }

        var dayOverride = overridesForScope.FirstOrDefault(o => o.Date == date && o.Slot == slot);
        if (dayOverride is not null)
        {
            if (dayOverride.Status == MilkDeliveryStatus.Missed)
            {
                return new MilkSlotStateDto(true, MilkCalendarStatus.Missed, 0m, hasExtra);
            }

            if (dayOverride.QuantityLtr is { } explicitQuantity)
            {
                return new MilkSlotStateDto(true, MilkCalendarStatus.Delivered, explicitQuantity, hasExtra);
            }
        }

        var change = quantityChanges.FirstOrDefault(q => q.StartDate <= date && q.EndDate >= date);
        var quantity = change is null ? defaultQuantity : slot == MilkSlot.Morning ? change.MorningQuantityLtr : change.EveningQuantityLtr;
        return new MilkSlotStateDto(true, MilkCalendarStatus.Delivered, quantity, hasExtra);
    }
}
