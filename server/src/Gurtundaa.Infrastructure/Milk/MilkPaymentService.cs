using Gurtundaa.Application.Common;
using Gurtundaa.Application.Milk;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Milk;

public class MilkPaymentService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IMilkPaymentService
{
    public async Task<IReadOnlyList<MilkPaymentDto>> ListForMonthAsync(int year, int month, CancellationToken ct)
    {
        var firstDay = new DateOnly(year, month, 1);
        var lastDay = firstDay.AddDays(DateTime.DaysInMonth(year, month) - 1);

        return await Mine()
            .Where(p => p.Date >= firstDay && p.Date <= lastDay)
            .OrderByDescending(p => p.Date).ThenByDescending(p => p.CreatedAt)
            .Select(p => ToDto(p))
            .ToListAsync(ct);
    }

    public async Task<MilkPaymentDto> CreateAsync(SaveMilkPaymentRequest request, CancellationToken ct)
    {
        var payment = new MilkPayment
        {
            UserId = currentUser.UserId,
            Date = request.Date,
            Amount = request.Amount,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            Method = PaymentMethod.Cash,
            Status = PaymentStatus.Confirmed,
            ConfirmedAt = clock.GetUtcNow(),
            CreatedAt = clock.GetUtcNow(),
        };

        db.MilkPayments.Add(payment);
        await db.SaveChangesAsync(ct);
        return ToDto(payment);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct) =>
        await Mine().Where(p => p.Id == id).ExecuteDeleteAsync(ct) > 0;

    public async Task<MilkProviderPaymentInfoDto> GetProviderPaymentInfoAsync(CancellationToken ct)
    {
        var subscription = await db.MilkSubscriptions.AsNoTracking()
            .SingleOrDefaultAsync(s => s.UserId == currentUser.UserId, ct);
        if (subscription?.ContactId is null)
        {
            return new MilkProviderPaymentInfoDto(null, null);
        }

        var link = await db.ProviderLinks.AsNoTracking()
            .SingleOrDefaultAsync(l => l.HouseholdUserId == currentUser.UserId && l.ServiceContactId == subscription.ContactId
                && l.Category == ServiceContactCategory.Milk && l.ProviderUserId != null && l.RevokedAt == null, ct);
        if (link is null)
        {
            return new MilkProviderPaymentInfoDto(null, null);
        }

        var provider = await db.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Id == link.ProviderUserId, ct);
        return new MilkProviderPaymentInfoDto(provider?.DisplayName, provider?.UpiId);
    }

    public async Task<MilkPaymentDto> InitiateUpiAsync(InitiateUpiPaymentRequest request, CancellationToken ct)
    {
        var payment = new MilkPayment
        {
            UserId = currentUser.UserId,
            Date = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime),
            Amount = request.Amount,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            Method = PaymentMethod.Upi,
            Status = PaymentStatus.AwaitingConfirmation,
            CreatedAt = clock.GetUtcNow(),
        };

        db.MilkPayments.Add(payment);
        await db.SaveChangesAsync(ct);
        return ToDto(payment);
    }

    private IQueryable<MilkPayment> Mine() => db.MilkPayments.Where(p => p.UserId == currentUser.UserId);

    private static MilkPaymentDto ToDto(MilkPayment p) => new(p.Id, p.Date, p.Amount, p.Note, p.Method, p.Status, p.CreatedAt);
}
