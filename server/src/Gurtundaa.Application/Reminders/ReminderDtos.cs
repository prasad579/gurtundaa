using System.ComponentModel.DataAnnotations;
using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Application.Reminders;

public sealed record ReminderDto(
    Guid Id,
    string Title,
    string? Notes,
    DateTimeOffset? DueAt,
    ReminderPriority Priority,
    bool IsDone,
    DateTimeOffset? CompletedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record SaveReminderRequest(
    [Required, MaxLength(200)] string Title,
    [MaxLength(2000)] string? Notes,
    DateTimeOffset? DueAt,
    ReminderPriority Priority = ReminderPriority.Normal);

public enum ReminderFilter
{
    All,
    Upcoming,
    Overdue,
    Done,
}

public sealed record ReminderStats(int Total, int Upcoming, int Overdue, int DoneToday, int Done);
