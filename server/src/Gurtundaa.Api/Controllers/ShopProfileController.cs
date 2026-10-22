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

    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp" };

    [HttpPost("image")]
    [RequestSizeLimit(5_000_000)] // 5 MB
    public async Task<ActionResult<UploadShopImageResponse>> UploadImage(IFormFile file, CancellationToken ct)
    {
        if (file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedImageExtensions.Contains(extension))
        {
            return BadRequest("Only .jpg, .jpeg, .png, or .webp images are allowed.");
        }

        await using var stream = file.OpenReadStream();
        return Ok(await shopProfile.UploadImageAsync(stream, extension, ct));
    }
}
