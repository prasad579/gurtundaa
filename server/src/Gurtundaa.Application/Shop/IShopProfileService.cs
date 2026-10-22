namespace Gurtundaa.Application.Shop;

public interface IShopProfileService
{
    Task<ShopProfileDto?> GetAsync(CancellationToken ct);

    Task<ShopProfileDto> SaveAsync(SaveShopProfileRequest request, CancellationToken ct);

    /// <summary>Saves the uploaded stream under wwwroot and records its URL on the shop's profile. `extension` includes the leading dot (e.g. ".jpg").</summary>
    Task<UploadShopImageResponse> UploadImageAsync(Stream content, string extension, CancellationToken ct);
}
