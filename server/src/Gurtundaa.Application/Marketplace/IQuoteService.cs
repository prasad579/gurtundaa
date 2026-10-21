namespace Gurtundaa.Application.Marketplace;

public interface IQuoteService
{
    /// <summary>Quotes on one of the current (customer) user's own requests.</summary>
    Task<IReadOnlyList<QuoteDto>> ListForRequestAsync(Guid requestId, CancellationToken ct);

    /// <summary>Requests targeting the current (shop) user.</summary>
    Task<IReadOnlyList<IncomingQuotationRequestDto>> ListIncomingAsync(CancellationToken ct);

    Task<IncomingQuotationRequestDto?> GetIncomingDetailAsync(Guid requestId, CancellationToken ct);

    Task<QuoteDto?> SubmitAsync(Guid requestId, SubmitQuoteRequest request, CancellationToken ct);

    /// <summary>Every quote the current (shop) user has ever submitted, any status — powers both the Orders tab (Accepted) and the Quote Results log (all).</summary>
    Task<IReadOnlyList<QuoteDto>> ListMineAsync(CancellationToken ct);

    Task<QuoteDto?> TogglePackedItemAsync(Guid quoteId, TogglePackedItemRequest request, CancellationToken ct);

    Task<QuoteDto?> AdvanceFulfillmentAsync(Guid quoteId, AdvanceFulfillmentRequest request, CancellationToken ct);
}
