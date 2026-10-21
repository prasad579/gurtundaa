namespace Gurtundaa.Application.Shop;

public interface IShopProfileService
{
    Task<ShopProfileDto?> GetAsync(CancellationToken ct);

    Task<ShopProfileDto> SaveAsync(SaveShopProfileRequest request, CancellationToken ct);
}
