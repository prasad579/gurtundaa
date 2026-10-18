using System.Linq.Expressions;
using Gurtundaa.Application.Common;
using Gurtundaa.Application.Milk;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Milk;

public class MilkQuantityChangeService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IMilkQuantityChangeService
{
    private static readonly Expression<Func<MilkQuantityChange, MilkQuantityChangeDto>> ToDtoExpression =
        q => new MilkQuantityChangeDto(q.Id, q.StartDate, q.EndDate, q.MorningQuantityLtr, q.EveningQuantityLtr, q.Reason, q.CreatedAt);

    private IQueryable<MilkQuantityChange> Mine => db.MilkQuantityChanges.Where(q => q.UserId == currentUser.UserId);

    public async Task<IReadOnlyList<MilkQuantityChangeDto>> ListAsync(bool upcomingOnly, CancellationToken ct)
    {
        var query = Mine.AsNoTracking();
        if (upcomingOnly)
        {
            var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);
            query = query.Where(q => q.EndDate >= today);
        }

        return await query.OrderBy(q => q.StartDate).Select(ToDtoExpression).ToListAsync(ct);
    }

    public async Task<MilkQuantityChangeDto> CreateAsync(SaveMilkQuantityChangeRequest request, CancellationToken ct)
    {
        var change = new MilkQuantityChange
        {
            UserId = currentUser.UserId,
            CreatedAt = clock.GetUtcNow(),
        };
        Apply(change, request);

        db.MilkQuantityChanges.Add(change);
        await db.SaveChangesAsync(ct);
        return ToDto(change);
    }

    public async Task<MilkQuantityChangeDto?> UpdateAsync(Guid id, SaveMilkQuantityChangeRequest request, CancellationToken ct)
    {
        var change = await Mine.SingleOrDefaultAsync(q => q.Id == id, ct);
        if (change is null)
        {
            return null;
        }

        Apply(change, request);
        await db.SaveChangesAsync(ct);
        return ToDto(change);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct) =>
        await Mine.Where(q => q.Id == id).ExecuteDeleteAsync(ct) > 0;

    private static void Apply(MilkQuantityChange change, SaveMilkQuantityChangeRequest request)
    {
        change.StartDate = request.StartDate;
        change.EndDate = request.EndDate;
        change.MorningQuantityLtr = request.MorningQuantityLtr;
        change.EveningQuantityLtr = request.EveningQuantityLtr;
        change.Reason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();
    }

    private static MilkQuantityChangeDto ToDto(MilkQuantityChange change) =>
        new(change.Id, change.StartDate, change.EndDate, change.MorningQuantityLtr, change.EveningQuantityLtr, change.Reason, change.CreatedAt);
}
