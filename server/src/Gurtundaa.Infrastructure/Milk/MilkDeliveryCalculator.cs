using Gurtundaa.Application.Milk;
using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Infrastructure.Milk;

/// <summary>
/// Pure resolution rules for "what happened to a milk slot on a given day" — pulled out of
/// <see cref="MilkDeliveryService"/> so the provider dashboard can resolve the same day for other
/// households' subscriptions without duplicating (and risking drifting from) these rules.
/// </summary>
public static class MilkDeliveryCalculator
{
    public static MilkCalendarStatus CombineStatus(MilkSlotStateDto morning, MilkSlotStateDto evening)
    {
        if (morning.Enabled && morning.Status == MilkCalendarStatus.Paused) return MilkCalendarStatus.Paused;
        if (evening.Enabled && evening.Status == MilkCalendarStatus.Paused) return MilkCalendarStatus.Paused;
        if (morning.Enabled && morning.Status == MilkCalendarStatus.Missed) return MilkCalendarStatus.Missed;
        if (evening.Enabled && evening.Status == MilkCalendarStatus.Missed) return MilkCalendarStatus.Missed;
        return MilkCalendarStatus.Delivered;
    }

    public static MilkSlotStateDto ResolveSlot(
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
