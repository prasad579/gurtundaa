namespace Gurtundaa.Domain.Entities;

public class QuotationRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CustomerUserId { get; set; }

    public AppUser? Customer { get; set; }

    public QuotationRequestStatus Status { get; set; } = QuotationRequestStatus.Open;

    /// <summary>System.Text.Json-serialized <c>List&lt;QuotationItemLine&gt;</c> — a point-in-time snapshot of the cart, always read/written as a whole unit.</summary>
    public string ItemsJson { get; set; } = "[]";

    public string? Notes { get; set; }

    /// <summary>When set, shops can no longer submit new quotes after this time passes.</summary>
    public DateTimeOffset? QuotesCloseAt { get; set; }

    public Guid? AcceptedQuoteId { get; set; }

    public Quote? AcceptedQuote { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum QuotationRequestStatus
{
    Open = 0,
    Closed = 1,
    Cancelled = 2,
}
