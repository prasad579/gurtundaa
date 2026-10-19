using Gurtundaa.Application.Common;
using Gurtundaa.Application.Milk;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Milk;

public class MilkSubscriptionService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IMilkSubscriptionService
{
    public async Task<MilkSubscriptionDto?> GetAsync(CancellationToken ct)
    {
        var subscription = await Mine().AsNoTracking().Include(s => s.Contact).SingleOrDefaultAsync(ct);
        return subscription is null ? null : ToDto(subscription);
    }

    public async Task<MilkSubscriptionDto> SaveAsync(SaveMilkSubscriptionRequest request, CancellationToken ct)
    {
        var subscription = await Mine().SingleOrDefaultAsync(ct);
        if (subscription is null)
        {
            subscription = new MilkSubscription { UserId = currentUser.UserId };
            db.MilkSubscriptions.Add(subscription);
        }

        subscription.ContactId = request.ContactId;
        subscription.StartDate = request.StartDate;
        subscription.MorningEnabled = request.MorningEnabled;
        subscription.MorningQuantityLtr = request.MorningQuantityLtr;
        subscription.MorningWindowStart = request.MorningWindowStart;
        subscription.MorningWindowEnd = request.MorningWindowEnd;
        subscription.EveningEnabled = request.EveningEnabled;
        subscription.EveningQuantityLtr = request.EveningQuantityLtr;
        subscription.EveningWindowStart = request.EveningWindowStart;
        subscription.EveningWindowEnd = request.EveningWindowEnd;
        subscription.RatePerLtr = request.RatePerLtr;
        subscription.SettlementCycle = request.SettlementCycle;
        subscription.UpdatedAt = clock.GetUtcNow();

        await db.SaveChangesAsync(ct);

        var contact = subscription.ContactId is null
            ? null
            : await db.ServiceContacts.AsNoTracking().SingleOrDefaultAsync(c => c.Id == subscription.ContactId, ct);
        return ToDto(subscription, contact);
    }

    private IQueryable<MilkSubscription> Mine() => db.MilkSubscriptions.Where(s => s.UserId == currentUser.UserId);

    private static MilkSubscriptionDto ToDto(MilkSubscription subscription, ServiceContact? contact = null)
    {
        contact ??= subscription.Contact;
        return new MilkSubscriptionDto(
            subscription.ContactId,
            contact?.Name,
            contact?.Phone,
            subscription.StartDate,
            subscription.MorningEnabled,
            subscription.MorningQuantityLtr,
            subscription.MorningWindowStart,
            subscription.MorningWindowEnd,
            subscription.EveningEnabled,
            subscription.EveningQuantityLtr,
            subscription.EveningWindowStart,
            subscription.EveningWindowEnd,
            subscription.RatePerLtr,
            subscription.SettlementCycle,
            subscription.UpdatedAt);
    }
}
