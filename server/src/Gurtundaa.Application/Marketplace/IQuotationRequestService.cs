namespace Gurtundaa.Application.Marketplace;

public interface IQuotationRequestService
{
    Task<QuotationRequestDto> SubmitAsync(SubmitQuotationRequest request, CancellationToken ct);

    Task<IReadOnlyList<QuotationRequestDto>> ListAsync(CancellationToken ct);

    Task<QuotationRequestDetailDto?> GetDetailAsync(Guid id, CancellationToken ct);

    Task<QuotationRequestDetailDto?> AcceptAsync(Guid id, AcceptQuoteRequest request, CancellationToken ct);

    Task<IReadOnlyList<ShopSummaryDto>> ListShopsAsync(CancellationToken ct);
}
