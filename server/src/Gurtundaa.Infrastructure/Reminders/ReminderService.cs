using System.Linq.Expressions;
using Gurtundaa.Application.Common;
using Gurtundaa.Application.Reminders;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Reminders;

public class ReminderService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IReminderService
{
    private static readonly Expression<Func<Reminder, ReminderDto>> ToDtoExpression =
        r => new ReminderDto(r.Id, r.Title, r.Notes, r.DueAt, r.Priority, r.IsDone, r.CompletedAt, r.CreatedAt, r.UpdatedAt);

    private static readonly Func<Reminder, ReminderDto> ToDto = ToDtoExpression.Compile();

    // Every query goes through this, so one user can never see or touch another user's reminders.
    private IQueryable<Reminder> Mine => db.Reminders.Where(r => r.UserId == currentUser.UserId);

    public async Task<IReadOnlyList<ReminderDto>> ListAsync(ReminderFilter filter, CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var query = Mine.AsNoTracking();

        query = filter switch
        {
            ReminderFilter.Upcoming => query.Where(r => !r.IsDone && (r.DueAt == null || r.DueAt >= now)),
            ReminderFilter.Overdue => query.Where(r => !r.IsDone && r.DueAt < now),
            ReminderFilter.Done => query.Where(r => r.IsDone),
            _ => query,
        };

        query = filter == ReminderFilter.Done
            ? query.OrderByDescending(r => r.CompletedAt)
            : query.OrderBy(r => r.IsDone)
                .ThenBy(r => r.DueAt == null)
                .ThenBy(r => r.DueAt)
                .ThenByDescending(r => r.Priority);

        return await query.Select(ToDtoExpression).ToListAsync(ct);
    }

    public async Task<ReminderDto?> GetAsync(Guid id, CancellationToken ct) =>
        await Mine.AsNoTracking().Where(r => r.Id == id).Select(ToDtoExpression).SingleOrDefaultAsync(ct);

    public async Task<ReminderDto> CreateAsync(SaveReminderRequest request, CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var reminder = new Reminder
        {
            UserId = currentUser.UserId,
            CreatedAt = now,
        };
        Apply(reminder, request, now);

        db.Reminders.Add(reminder);
        await db.SaveChangesAsync(ct);
        return ToDto(reminder);
    }

    public async Task<ReminderDto?> UpdateAsync(Guid id, SaveReminderRequest request, CancellationToken ct)
    {
        var reminder = await Mine.SingleOrDefaultAsync(r => r.Id == id, ct);
        if (reminder is null)
        {
            return null;
        }

        Apply(reminder, request, clock.GetUtcNow());
        await db.SaveChangesAsync(ct);
        return ToDto(reminder);
    }

    public async Task<ReminderDto?> SetDoneAsync(Guid id, bool isDone, CancellationToken ct)
    {
        var reminder = await Mine.SingleOrDefaultAsync(r => r.Id == id, ct);
        if (reminder is null)
        {
            return null;
        }

        var now = clock.GetUtcNow();
        reminder.IsDone = isDone;
        reminder.CompletedAt = isDone ? now : null;
        reminder.UpdatedAt = now;

        await db.SaveChangesAsync(ct);
        return ToDto(reminder);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct) =>
        await Mine.Where(r => r.Id == id).ExecuteDeleteAsync(ct) > 0;

    public async Task<ReminderStats> GetStatsAsync(CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var startOfDay = new DateTimeOffset(now.UtcDateTime.Date, TimeSpan.Zero);

        var stats = await Mine
            .GroupBy(_ => 1)
            .Select(g => new ReminderStats(
                g.Count(),
                g.Count(r => !r.IsDone && (r.DueAt == null || r.DueAt >= now)),
                g.Count(r => !r.IsDone && r.DueAt < now),
                g.Count(r => r.IsDone && r.CompletedAt >= startOfDay),
                g.Count(r => r.IsDone)))
            .SingleOrDefaultAsync(ct);

        return stats ?? new ReminderStats(0, 0, 0, 0, 0);
    }

    private static void Apply(Reminder reminder, SaveReminderRequest request, DateTimeOffset now)
    {
        reminder.Title = request.Title.Trim();
        reminder.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        reminder.DueAt = request.DueAt;
        reminder.Priority = request.Priority;
        reminder.UpdatedAt = now;
    }
}
