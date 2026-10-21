namespace Gurtundaa.Domain.Entities;

public class Quote
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid QuotationRequestId { get; set; }

    public QuotationRequest? QuotationRequest { get; set; }

    public Guid ShopUserId { get; set; }

    public AppUser? Shop { get; set; }

    public QuoteStatus Status { get; set; } = QuoteStatus.Submitted;

    /// <summary>System.Text.Json-serialized <c>List&lt;QuoteItemLine&gt;</c> — always read/written as a whole unit.</summary>
    public string ItemsJson { get; set; } = "[]";

    public decimal TotalAmount { get; set; }

    public decimal DeliveryChargeAmount { get; set; }

    public int? EstimatedDeliveryMinutes { get; set; }

    public DateTimeOffset? ValidUntil { get; set; }

    public string? Note { get; set; }

    public FulfillmentStatus FulfillmentStatus { get; set; } = FulfillmentStatus.Accepted;

    /// <summary>System.Text.Json-serialized <c>List&lt;string&gt;</c> of itemKeys the shop has packed so far — only meaningful once Status is Accepted.</summary>
    public string PackedItemKeysJson { get; set; } = "[]";

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum QuoteStatus
{
    Submitted = 0,
    Accepted = 1,
    Rejected = 2,
    Withdrawn = 3,
}

public enum FulfillmentStatus
{
    Accepted = 0,
    Packing = 1,
    OutForDelivery = 2,
    Delivered = 3,
}
