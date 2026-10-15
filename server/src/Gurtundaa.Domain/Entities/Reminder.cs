namespace Gurtundaa.Domain.Entities;

public class Reminder
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public DateTimeOffset? DueAt { get; set; }

    public ReminderPriority Priority { get; set; } = ReminderPriority.Normal;

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
