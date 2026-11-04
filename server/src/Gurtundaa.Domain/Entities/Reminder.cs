namespace Gurtundaa.Domain.Entities;

public class Reminder
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    /// <summary>Who this reminder is actually for, e.g. "remind mother to..." — null means it's for the logged-in user themselves.</summary>
    public Guid? MemberId { get; set; }

    public HouseholdMember? Member { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public DateTimeOffset? DueAt { get; set; }

    public ReminderPriority Priority { get; set; } = ReminderPriority.Normal;

    public ReminderRecurrence Recurrence { get; set; } = ReminderRecurrence.None;

    /// <summary>Only meaningful when <see cref="Recurrence"/> is <see cref="ReminderRecurrence.Weekly"/>.</summary>
    public DayOfWeek? RecurrenceDayOfWeek { get; set; }

    public bool IsDone { get; set; }

    public DateTimeOffset? CompletedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum ReminderPriority
{
    Chill = 0,
    Normal = 1,
    Urgent = 2,
}

public enum ReminderRecurrence
{
    None = 0,
    Daily = 1,
    Weekly = 2,
}
