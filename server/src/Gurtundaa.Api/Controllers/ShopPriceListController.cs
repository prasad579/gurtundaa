using Gurtundaa.Application.Marketplace;
using Gurtundaa.Application.Shop;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize(Roles = "Shop")]
[Route("api/shop/price-list")]
public class ShopPriceListController(IShopPriceListService priceList) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<PriceListEntryDto>> Get(CancellationToken ct) => await priceList.GetAsync(ct);

    [HttpPut]
    public async Task<IReadOnlyList<PriceListEntryDto>> Save(SavePriceListRequest request, CancellationToken ct) =>
        await priceList.SaveAsync(request, ct);
}
