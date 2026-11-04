namespace Gurtundaa.Domain.Entities;

public class GroceryItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    public string Name { get; set; } = string.Empty;

    public bool IsChecked { get; set; }

    /// <summary>Set when the household asked for this every week (e.g. "add vegetables every Sunday") — display-only for now, not auto-regenerated.</summary>
    public DayOfWeek? RecurringWeekday { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
