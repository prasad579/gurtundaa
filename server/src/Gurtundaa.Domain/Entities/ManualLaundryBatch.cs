namespace Gurtundaa.Domain.Entities;

/// <summary>A laundry batch a provider logs directly against one of their manual (off-app) customers — same shape as <see cref="LaundryBatch"/>, owned by a <see cref="ProviderCustomer"/> instead of a household.</summary>
public class ManualLaundryBatch
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProviderCustomerId { get; set; }

    public ProviderCustomer? ProviderCustomer { get; set; }

    public LaundryServiceType ServiceType { get; set; } = LaundryServiceType.WashAndIron;

    public DateOnly GivenOn { get; set; }

    public DateOnly? ExpectedReturn { get; set; }

    public LaundryBatchStatus Status { get; set; } = LaundryBatchStatus.Active;

    public DateOnly? PickedUpOn { get; set; }

    public decimal? Amount { get; set; }

    public bool IsPaid { get; set; }

    public DateTimeOffset? PaidAt { get; set; }

    /// <summary>System.Text.Json-serialized <c>List&lt;LaundryItemLine&gt;</c> — same shape as LaundryBatch.ItemsJson.</summary>
    public string ItemsJson { get; set; } = "[]";

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
