namespace Gurtundaa.Domain.Entities;

public class Bill
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    public BillCategory Category { get; set; }

    public string Name { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public DateOnly DueDate { get; set; }

    public BillRecurrence Recurrence { get; set; } = BillRecurrence.Monthly;

    public int ReminderLeadDays { get; set; } = 3;

    public bool IsPaid { get; set; }

    public DateTimeOffset? PaidAt { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum BillCategory
{
    Electricity = 0,
    Water = 1,
    Phone = 2,
    Internet = 3,
    CreditCard = 4,
    Rent = 5,
    Insurance = 6,
    Subscription = 7,
    Other = 8,
}

public enum BillRecurrence
{
    OneTime = 0,
    Monthly = 1,
    Quarterly = 2,
    Yearly = 3,
}
