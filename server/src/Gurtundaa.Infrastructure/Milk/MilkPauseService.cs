using System.Linq.Expressions;
using Gurtundaa.Application.Common;
using Gurtundaa.Application.Milk;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Milk;

public class MilkPauseService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IMilkPauseService
{
    private static readonly Expression<Func<MilkPause, MilkPauseDto>> ToDtoExpression =
        p => new MilkPauseDto(p.Id, p.StartDate, p.EndDate, p.Reason, p.CreatedAt);

    private IQueryable<MilkPause> Mine => db.MilkPauses.Where(p => p.UserId == currentUser.UserId);

    public async Task<IReadOnlyList<MilkPauseDto>> ListAsync(bool upcomingOnly, CancellationToken ct)
    {
        var query = Mine.AsNoTracking();
        if (upcomingOnly)
        {
            var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);
            query = query.Where(p => p.EndDate >= today);
        }

        return await query.OrderBy(p => p.StartDate).Select(ToDtoExpression).ToListAsync(ct);
    }

    public async Task<MilkPauseDto> CreateAsync(SaveMilkPauseRequest request, CancellationToken ct)
    {
        var pause = new MilkPause
        {
            UserId = currentUser.UserId,
            CreatedAt = clock.GetUtcNow(),
        };
        Apply(pause, request);

        db.MilkPauses.Add(pause);
        await db.SaveChangesAsync(ct);
        return new MilkPauseDto(pause.Id, pause.StartDate, pause.EndDate, pause.Reason, pause.CreatedAt);
    }

    public async Task<MilkPauseDto?> UpdateAsync(Guid id, SaveMilkPauseRequest request, CancellationToken ct)
    {
        var pause = await Mine.SingleOrDefaultAsync(p => p.Id == id, ct);
        if (pause is null)
        {
            return null;
        }

        Apply(pause, request);
        await db.SaveChangesAsync(ct);
        return new MilkPauseDto(pause.Id, pause.StartDate, pause.EndDate, pause.Reason, pause.CreatedAt);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct) =>
        await Mine.Where(p => p.Id == id).ExecuteDeleteAsync(ct) > 0;

    private static void Apply(MilkPause pause, SaveMilkPauseRequest request)
    {
        pause.StartDate = request.StartDate;
        pause.EndDate = request.EndDate;
        pause.Reason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();
    }
}
