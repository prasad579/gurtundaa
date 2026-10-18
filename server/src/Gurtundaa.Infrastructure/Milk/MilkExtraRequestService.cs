using System.Linq.Expressions;
using Gurtundaa.Application.Common;
using Gurtundaa.Application.Milk;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Milk;

public class MilkExtraRequestService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IMilkExtraRequestService
{
    private static readonly Expression<Func<MilkExtraRequest, MilkExtraRequestDto>> ToDtoExpression =
        e => new MilkExtraRequestDto(e.Id, e.Date, e.Slot, e.QuantityLtr, e.Reason, e.CreatedAt);

    private IQueryable<MilkExtraRequest> Mine => db.MilkExtraRequests.Where(e => e.UserId == currentUser.UserId);

    public async Task<IReadOnlyList<MilkExtraRequestDto>> ListAsync(bool upcomingOnly, CancellationToken ct)
    {
        var query = Mine.AsNoTracking();
        if (upcomingOnly)
        {
            var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);
            query = query.Where(e => e.Date >= today);
        }

        return await query.OrderBy(e => e.Date).Select(ToDtoExpression).ToListAsync(ct);
    }

    public async Task<MilkExtraRequestDto> CreateAsync(SaveMilkExtraRequestRequest request, CancellationToken ct)
    {
        var extra = new MilkExtraRequest
        {
            UserId = currentUser.UserId,
            Date = request.Date,
            Slot = request.Slot,
            QuantityLtr = request.QuantityLtr,
            Reason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim(),
            CreatedAt = clock.GetUtcNow(),
        };

        db.MilkExtraRequests.Add(extra);
        await db.SaveChangesAsync(ct);
        return new MilkExtraRequestDto(extra.Id, extra.Date, extra.Slot, extra.QuantityLtr, extra.Reason, extra.CreatedAt);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct) =>
        await Mine.Where(e => e.Id == id).ExecuteDeleteAsync(ct) > 0;
}
