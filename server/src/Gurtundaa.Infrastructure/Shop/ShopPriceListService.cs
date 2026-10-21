using System.Text.Json;
using Gurtundaa.Application.Common;
using Gurtundaa.Application.Marketplace;
using Gurtundaa.Application.Shop;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Shop;

public class ShopPriceListService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IShopPriceListService
{
    public async Task<IReadOnlyList<PriceListEntryDto>> GetAsync(CancellationToken ct)
    {
        var json = await Mine().AsNoTracking().Select(p => p.PriceListJson).SingleOrDefaultAsync(ct);
        return ToDtos(json);
    }

    public async Task<IReadOnlyList<PriceListEntryDto>> SaveAsync(SavePriceListRequest request, CancellationToken ct)
    {
        var profile = await Mine().SingleOrDefaultAsync(ct);
        if (profile is null)
        {
            profile = new ShopProfile { UserId = currentUser.UserId };
            db.ShopProfiles.Add(profile);
        }

        var priceList = MarketplaceCategoryHelper.DeserializePriceList(profile.PriceListJson);
        var now = clock.GetUtcNow();
        foreach (var item in request.Items)
        {
            priceList[item.ItemKey] = MarketplaceCategoryHelper.UpsertPriceListEntry(priceList.GetValueOrDefault(item.ItemKey), item.ItemKey, item.UnitPrice, now);
        }

        profile.PriceListJson = JsonSerializer.Serialize(priceList);

        await db.SaveChangesAsync(ct);
        return ToDtos(profile.PriceListJson);
    }

    private IQueryable<ShopProfile> Mine() => db.ShopProfiles.Where(p => p.UserId == currentUser.UserId);

    private static List<PriceListEntryDto> ToDtos(string? json) =>
        MarketplaceCategoryHelper.DeserializePriceList(json).Values.OrderByDescending(e => e.UpdatedAt).ToList();
}
