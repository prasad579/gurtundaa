namespace Gurtundaa.Domain.Entities;

public class QuotationRequestShopTarget
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid QuotationRequestId { get; set; }

    public QuotationRequest? QuotationRequest { get; set; }

    public Guid ShopUserId { get; set; }

    public AppUser? Shop { get; set; }

    public QuotationRequestTargetStatus Status { get; set; } = QuotationRequestTargetStatus.Sent;
}

public enum QuotationRequestTargetStatus
{
    Sent = 0,
    Viewed = 1,
    Quoted = 2,
    Declined = 3,
}
