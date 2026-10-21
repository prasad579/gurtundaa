using Gurtundaa.Application.Marketplace;

namespace Gurtundaa.Application.Shop;

public interface IShopPriceListService
{
    Task<IReadOnlyList<PriceListEntryDto>> GetAsync(CancellationToken ct);

    Task<IReadOnlyList<PriceListEntryDto>> SaveAsync(SavePriceListRequest request, CancellationToken ct);
}
