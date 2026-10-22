using Gurtundaa.Application.Common;
using Gurtundaa.Application.Milk;
using Gurtundaa.Application.Providers;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Milk;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Providers;

public class ProviderMilkActionsService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IProviderMilkActionsService
{
    public async Task<Result<MilkTodayDto>> SetDeliveryOverrideAsync(Guid householdUserId, DateOnly date, SetMilkDeliveryOverrideRequest request, CancellationToken ct)
    {
        if (!await IsLinkedAsync(householdUserId, ct))
        {
            return Result<MilkTodayDto>.Fail("This household isn't linked to your account.");
        }

        var now = clock.GetUtcNow();
        var entity = await db.MilkDeliveryOverrides.SingleOrDefaultAsync(o => o.UserId == householdUserId && o.Date == date && o.Slot == request.Slot, ct);
        if (entity is null)
        {
            entity = new MilkDeliveryOverride { UserId = householdUserId, Date = date, Slot = request.Slot, CreatedAt = now };
            db.MilkDeliveryOverrides.Add(entity);
        }

        entity.Status = request.Status;
        entity.QuantityLtr = request.QuantityLtr;
        entity.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        entity.AddedByProviderId = currentUser.UserId;
        entity.SeenByHouseholdAt = null; // re-flag as unseen even if this slot already had a (now-overwritten) household-made entry

        await db.SaveChangesAsync(ct);

        return Result<MilkTodayDto>.Ok(await ResolveDayAsync(householdUserId, date, ct));
    }

    public async Task<Result<MilkExtraRequestDto>> AddExtraAsync(Guid householdUserId, SaveMilkExtraRequestRequest request, CancellationToken ct)
    {
        if (!await IsLinkedAsync(householdUserId, ct))
        {
            return Result<MilkExtraRequestDto>.Fail("This household isn't linked to your account.");
        }

        var providerName = await db.Users.AsNoTracking()
            .Where(u => u.Id == currentUser.UserId)
            .Select(u => u.DisplayName)
            .SingleOrDefaultAsync(ct);

        var extra = new MilkExtraRequest
        {
            UserId = householdUserId,
            Date = request.Date,
            Slot = request.Slot,
            QuantityLtr = request.QuantityLtr,
            Reason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim(),
            AddedByProviderId = currentUser.UserId,
            CreatedAt = clock.GetUtcNow(),
        };

        db.MilkExtraRequests.Add(extra);
        await db.SaveChangesAsync(ct);

        return Result<MilkExtraRequestDto>.Ok(new MilkExtraRequestDto(extra.Id, extra.Date, extra.Slot, extra.QuantityLtr, extra.Reason, extra.CreatedAt, providerName));
    }

    public async Task<IReadOnlyList<PendingMilkPaymentDto>> ListPendingPaymentsAsync(CancellationToken ct)
    {
        var householdIds = await db.ProviderLinks.AsNoTracking()
            .Where(l => l.ProviderUserId == currentUser.UserId && l.Category == ServiceContactCategory.Milk && l.RevokedAt == null)
            .Select(l => l.HouseholdUserId)
            .Distinct()
            .ToListAsync(ct);
        if (householdIds.Count == 0)
        {
            return [];
        }

        var payments = await db.MilkPayments.AsNoTracking()
            .Where(p => householdIds.Contains(p.UserId) && p.Status == PaymentStatus.AwaitingConfirmation)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync(ct);

        var names = await db.Users.AsNoTracking()
            .Where(u => householdIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.DisplayName, ct);

        return payments
            .Select(p => new PendingMilkPaymentDto(p.Id, p.UserId, names.GetValueOrDefault(p.UserId, ""), p.Date, p.Amount, p.Note, p.CreatedAt))
            .ToList();
    }

    public async Task<bool> ConfirmPaymentAsync(Guid paymentId, CancellationToken ct)
    {
        var payment = await LoadPendingPaymentOwnedByMeAsync(paymentId, ct);
        if (payment is null)
        {
            return false;
        }

        payment.Status = PaymentStatus.Confirmed;
        payment.ConfirmedAt = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> RejectPaymentAsync(Guid paymentId, CancellationToken ct)
    {
        var payment = await LoadPendingPaymentOwnedByMeAsync(paymentId, ct);
        if (payment is null)
        {
            return false;
        }

        payment.Status = PaymentStatus.Rejected;
        await db.SaveChangesAsync(ct);
        return true;
    }

    private async Task<MilkPayment?> LoadPendingPaymentOwnedByMeAsync(Guid paymentId, CancellationToken ct)
    {
        var payment = await db.MilkPayments.SingleOrDefaultAsync(p => p.Id == paymentId && p.Status == PaymentStatus.AwaitingConfirmation, ct);
        if (payment is null || !await IsLinkedAsync(payment.UserId, ct))
        {
            return null;
        }

        return payment;
    }

    private async Task<bool> IsLinkedAsync(Guid householdUserId, CancellationToken ct) =>
        await db.ProviderLinks.AsNoTracking().AnyAsync(l =>
            l.ProviderUserId == currentUser.UserId && l.HouseholdUserId == householdUserId &&
            l.Category == ServiceContactCategory.Milk && l.RevokedAt == null, ct);

    private async Task<MilkTodayDto> ResolveDayAsync(Guid householdUserId, DateOnly date, CancellationToken ct)
    {
        var subscription = await db.MilkSubscriptions.AsNoTracking().SingleOrDefaultAsync(s => s.UserId == householdUserId, ct);
        var pauses = await db.MilkPauses.AsNoTracking().Where(p => p.UserId == householdUserId && p.StartDate <= date && p.EndDate >= date).ToListAsync(ct);
        var changes = await db.MilkQuantityChanges.AsNoTracking().Where(q => q.UserId == householdUserId && q.StartDate <= date && q.EndDate >= date).ToListAsync(ct);
        var overrides = await db.MilkDeliveryOverrides.AsNoTracking().Where(o => o.UserId == householdUserId && o.Date == date).ToListAsync(ct);
        var hasExtra = (await db.MilkExtraRequests.AsNoTracking().Where(e => e.UserId == householdUserId && e.Date == date).Select(e => e.Slot).ToListAsync(ct)).ToHashSet();

        var morning = MilkDeliveryCalculator.ResolveSlot(MilkSlot.Morning, date, subscription, pauses, overrides, changes, hasExtra.Contains(MilkSlot.Morning));
        var evening = MilkDeliveryCalculator.ResolveSlot(MilkSlot.Evening, date, subscription, pauses, overrides, changes, hasExtra.Contains(MilkSlot.Evening));
        return new MilkTodayDto(date, morning, evening, overrides.Count == 0);
    }
}
