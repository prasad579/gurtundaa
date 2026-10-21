using System.Text.Json;
using Gurtundaa.Application.Common;
using Gurtundaa.Application.Marketplace;
using Gurtundaa.Application.Shop;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Shop;

public class ShopProfileService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IShopProfileService
{
    public async Task<ShopProfileDto?> GetAsync(CancellationToken ct)
    {
        var profile = await Mine().AsNoTracking().SingleOrDefaultAsync(ct);
        return profile is null ? null : ToDto(profile);
    }

    public async Task<ShopProfileDto> SaveAsync(SaveShopProfileRequest request, CancellationToken ct)
    {
        var profile = await Mine().SingleOrDefaultAsync(ct);
        if (profile is null)
        {
            profile = new ShopProfile { UserId = currentUser.UserId };
            db.ShopProfiles.Add(profile);
        }

        profile.ShopName = request.ShopName.Trim();
        profile.City = request.City?.Trim();
        profile.Address = request.Address?.Trim();
        profile.ServedCategoryKeysJson = JsonSerializer.Serialize(request.ServedCategoryKeys.Distinct());
        profile.UpdatedAt = clock.GetUtcNow();

        await db.SaveChangesAsync(ct);
        return ToDto(profile);
    }

    private IQueryable<ShopProfile> Mine() => db.ShopProfiles.Where(p => p.UserId == currentUser.UserId);

    private static ShopProfileDto ToDto(ShopProfile profile) => new(
        profile.ShopName,
        profile.City,
        profile.Address,
        MarketplaceCategoryHelper.DeserializeCategoryKeys(profile.ServedCategoryKeysJson));
}
