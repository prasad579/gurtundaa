using Gurtundaa.Application.Shop;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize(Roles = "Shop")]
[Route("api/shop/profile")]
public class ShopProfileController(IShopProfileService shopProfile) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ShopProfileDto>> Get(CancellationToken ct) =>
        await shopProfile.GetAsync(ct) is { } profile ? Ok(profile) : NoContent();

    [HttpPut]
    public async Task<ActionResult<ShopProfileDto>> Save(SaveShopProfileRequest request, CancellationToken ct) =>
        Ok(await shopProfile.SaveAsync(request, ct));
}
