namespace Gurtundaa.Domain.Entities;

public class LaundryBatch
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    public Guid? ContactId { get; set; }

    public ServiceContact? Contact { get; set; }

    public LaundryServiceType ServiceType { get; set; } = LaundryServiceType.WashAndIron;

    public DateOnly GivenOn { get; set; }

    public DateOnly? ExpectedReturn { get; set; }

    public LaundryBatchStatus Status { get; set; } = LaundryBatchStatus.Active;

    public DateOnly? PickedUpOn { get; set; }

    public decimal? Amount { get; set; }

    public bool IsPaid { get; set; }

    public DateTimeOffset? PaidAt { get; set; }

    /// <summary>System.Text.Json-serialized <c>List&lt;LaundryItemLine&gt;</c> — always read/written as a whole unit.</summary>
    public string ItemsJson { get; set; } = "[]";

    public string? Notes { get; set; }

    public string? PhotoUrl { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum LaundryBatchStatus
{
    Active = 0,
    PickedUp = 1,
}

public enum LaundryServiceType
{
    Ironing = 0,
    WashAndIron = 1,
    DryClean = 2,
    Other = 3,
}
