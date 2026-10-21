using System.Text.Json;
using Gurtundaa.Application.Common;
using Gurtundaa.Application.Marketplace;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Marketplace;

public class QuoteService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IQuoteService
{
    // Visible to the customer who owns the parent request — not a global query filter (this
    // codebase doesn't use HasQueryFilter anywhere), just an explicit join on CustomerUserId.
    private IQueryable<Quote> ForMyRequest(Guid requestId) =>
        db.Quotes.Where(q => q.QuotationRequestId == requestId && q.QuotationRequest!.CustomerUserId == currentUser.UserId);

    // Visible to the shop that authored it.
    private IQueryable<Quote> MineAsShop() => db.Quotes.Where(q => q.ShopUserId == currentUser.UserId);

    private IQueryable<QuotationRequestShopTarget> MyTargets() =>
        db.QuotationRequestShopTargets.Where(t => t.ShopUserId == currentUser.UserId);

    public async Task<IReadOnlyList<QuoteDto>> ListForRequestAsync(Guid requestId, CancellationToken ct)
    {
        var quotes = await ForMyRequest(requestId).OrderBy(q => q.TotalAmount).ToListAsync(ct);
        var shopNames = await ShopNamesAsync(quotes.Select(q => q.ShopUserId), ct);
        var shopPhones = await PhoneNumbersAsync(quotes.Select(q => q.ShopUserId), ct);
        return quotes.Select(q => ToDto(q, shopNames[q.ShopUserId], shopPhone: shopPhones.GetValueOrDefault(q.ShopUserId))).ToList();
    }

    public async Task<IReadOnlyList<QuoteDto>> ListMineAsync(CancellationToken ct)
    {
        var quotes = await MineAsShop().Include(q => q.QuotationRequest).OrderByDescending(q => q.UpdatedAt).ToListAsync(ct);
        var shopNames = await ShopNamesAsync([currentUser.UserId], ct);

        var acceptedCustomerIds = quotes.Where(q => q.Status == QuoteStatus.Accepted)
            .Select(q => q.QuotationRequest!.CustomerUserId)
            .ToList();
        var customers = acceptedCustomerIds.Count > 0
            ? await db.Users.AsNoTracking().Where(u => acceptedCustomerIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, ct)
            : [];

        return quotes.Select(q =>
        {
            var customer = q.Status == QuoteStatus.Accepted && customers.TryGetValue(q.QuotationRequest!.CustomerUserId, out var c) ? c : null;
            return ToDto(q, shopNames[currentUser.UserId], customerName: customer?.DisplayName, customerPhone: customer?.PhoneNumber);
        }).ToList();
    }

    public async Task<QuoteDto?> TogglePackedItemAsync(Guid quoteId, TogglePackedItemRequest request, CancellationToken ct)
    {
        var quote = await MineAsShop().Include(q => q.QuotationRequest).SingleOrDefaultAsync(q => q.Id == quoteId, ct);
        if (quote is null || quote.Status != QuoteStatus.Accepted)
        {
            return null;
        }

        var packed = MarketplaceCategoryHelper.DeserializeCategoryKeys(quote.PackedItemKeysJson);
        if (!packed.Remove(request.ItemKey))
        {
            packed.Add(request.ItemKey);
        }

        quote.PackedItemKeysJson = JsonSerializer.Serialize(packed);
        quote.UpdatedAt = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);

        return await ToAcceptedDtoAsync(quote, ct);
    }

    public async Task<QuoteDto?> AdvanceFulfillmentAsync(Guid quoteId, AdvanceFulfillmentRequest request, CancellationToken ct)
    {
        var quote = await MineAsShop().Include(q => q.QuotationRequest).SingleOrDefaultAsync(q => q.Id == quoteId, ct);
        if (quote is null || quote.Status != QuoteStatus.Accepted)
        {
            return null;
        }

        // Forward-only: no skipping backward through the lifecycle.
        if (request.Status <= quote.FulfillmentStatus)
        {
            return await ToAcceptedDtoAsync(quote, ct);
        }

        quote.FulfillmentStatus = request.Status;
        quote.UpdatedAt = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);

        return await ToAcceptedDtoAsync(quote, ct);
    }

    private async Task<QuoteDto> ToAcceptedDtoAsync(Quote quote, CancellationToken ct)
    {
        var shopNames = await ShopNamesAsync([currentUser.UserId], ct);
        var customer = await db.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Id == quote.QuotationRequest!.CustomerUserId, ct);
        return ToDto(quote, shopNames[currentUser.UserId], customerName: customer?.DisplayName, customerPhone: customer?.PhoneNumber);
    }

    public async Task<IReadOnlyList<IncomingQuotationRequestDto>> ListIncomingAsync(CancellationToken ct)
    {
        var targets = await MyTargets()
            .Include(t => t.QuotationRequest)
            .OrderByDescending(t => t.QuotationRequest!.CreatedAt)
            .ToListAsync(ct);

        var myCategoryKeys = await MyServedCategoryKeysAsync(ct);
        var result = new List<IncomingQuotationRequestDto>();
        foreach (var target in targets)
        {
            result.Add(await ToIncomingDtoAsync(target.QuotationRequest!, target.Status, myCategoryKeys, ct));
        }

        return result;
    }

    public async Task<IncomingQuotationRequestDto?> GetIncomingDetailAsync(Guid requestId, CancellationToken ct)
    {
        var target = await MyTargets()
            .Include(t => t.QuotationRequest)
            .SingleOrDefaultAsync(t => t.QuotationRequestId == requestId, ct);
        if (target is null)
        {
            return null;
        }

        var myCategoryKeys = await MyServedCategoryKeysAsync(ct);
        return await ToIncomingDtoAsync(target.QuotationRequest!, target.Status, myCategoryKeys, ct);
    }

    // A shop that hasn't configured any categories yet (empty list) sees the full, unfiltered item
    // list — avoids silently hiding everything from shop accounts that predate this feature.
    private async Task<IReadOnlyList<string>?> MyServedCategoryKeysAsync(CancellationToken ct)
    {
        var json = await db.ShopProfiles.AsNoTracking()
            .Where(p => p.UserId == currentUser.UserId)
            .Select(p => p.ServedCategoryKeysJson)
            .SingleOrDefaultAsync(ct);
        if (json is null)
        {
            return null;
        }

        var keys = MarketplaceCategoryHelper.DeserializeCategoryKeys(json);
        return keys.Count == 0 ? null : keys;
    }

    public async Task<QuoteDto?> SubmitAsync(Guid requestId, SubmitQuoteRequest request, CancellationToken ct)
    {
        var target = await MyTargets().SingleOrDefaultAsync(t => t.QuotationRequestId == requestId, ct);
        if (target is null)
        {
            return null;
        }

        var quotationRequest = await db.QuotationRequests.SingleAsync(r => r.Id == requestId, ct);
        if (quotationRequest.QuotesCloseAt is { } closeAt && clock.GetUtcNow() > closeAt)
        {
            throw new InvalidOperationException("Quotes for this request have closed.");
        }

        var requestItems = JsonSerializer.Deserialize<List<QuotationItemLine>>(quotationRequest.ItemsJson) ?? [];
        var priceByKey = request.Items.ToDictionary(i => i.ItemKey, i => i.UnitPrice);

        var quoteItems = requestItems
            .Where(i => priceByKey.ContainsKey(i.ItemKey))
            .Select(i => new QuoteItemLine(i.ItemKey, i.Name, i.Qty, i.Pack, priceByKey[i.ItemKey]))
            .ToList();

        var quote = await MineAsShop().SingleOrDefaultAsync(q => q.QuotationRequestId == requestId, ct);
        var now = clock.GetUtcNow();
        if (quote is null)
        {
            quote = new Quote { QuotationRequestId = requestId, ShopUserId = currentUser.UserId, CreatedAt = now };
            db.Quotes.Add(quote);
        }

        quote.ItemsJson = JsonSerializer.Serialize(quoteItems);
        quote.DeliveryChargeAmount = request.DeliveryChargeAmount;
        quote.TotalAmount = quoteItems.Sum(i => i.Qty * i.UnitPrice) + request.DeliveryChargeAmount;
        quote.EstimatedDeliveryMinutes = request.EstimatedDeliveryMinutes;
        quote.ValidUntil = request.ValidUntil;
        quote.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        quote.Status = QuoteStatus.Submitted;
        quote.UpdatedAt = now;

        target.Status = QuotationRequestTargetStatus.Quoted;

        await RememberPricesAsync(request.Items, ct);

        await db.SaveChangesAsync(ct);

        var shopNames = await ShopNamesAsync([currentUser.UserId], ct);
        return ToDto(quote, shopNames[currentUser.UserId]);
    }

    // Every submitted quote becomes this shop's new "last known price" reference for these items,
    // so next time the same item comes up they see what they charged last rather than a blank field.
    private async Task RememberPricesAsync(IReadOnlyList<SubmitQuoteItemLine> items, CancellationToken ct)
    {
        var profile = await db.ShopProfiles.SingleOrDefaultAsync(p => p.UserId == currentUser.UserId, ct);
        if (profile is null)
        {
            profile = new ShopProfile { UserId = currentUser.UserId };
            db.ShopProfiles.Add(profile);
        }

        var priceList = MarketplaceCategoryHelper.DeserializePriceList(profile.PriceListJson);
        var now = clock.GetUtcNow();
        foreach (var item in items)
        {
            priceList[item.ItemKey] = MarketplaceCategoryHelper.UpsertPriceListEntry(priceList.GetValueOrDefault(item.ItemKey), item.ItemKey, item.UnitPrice, now);
        }

        profile.PriceListJson = JsonSerializer.Serialize(priceList);
    }

    private async Task<Dictionary<Guid, string>> ShopNamesAsync(IEnumerable<Guid> shopUserIds, CancellationToken ct)
    {
        var ids = shopUserIds.Distinct().ToList();
        var profileNames = await db.ShopProfiles.AsNoTracking()
            .Where(p => ids.Contains(p.UserId))
            .ToDictionaryAsync(p => p.UserId, p => p.ShopName, ct);

        var missingIds = ids.Where(id => !profileNames.ContainsKey(id)).ToList();
        if (missingIds.Count > 0)
        {
            // Shop hasn't finished shop-onboarding yet (no ShopProfile row) — fall back to their account name.
            var fallbackNames = await db.Users.AsNoTracking()
                .Where(u => missingIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.DisplayName, ct);
            foreach (var (id, name) in fallbackNames)
            {
                profileNames[id] = name;
            }
        }

        return profileNames;
    }

    private async Task<Dictionary<Guid, string?>> PhoneNumbersAsync(IEnumerable<Guid> userIds, CancellationToken ct)
    {
        var ids = userIds.Distinct().ToList();
        return await db.Users.AsNoTracking()
            .Where(u => ids.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.PhoneNumber, ct);
    }

    private async Task<IncomingQuotationRequestDto> ToIncomingDtoAsync(
        QuotationRequest request, QuotationRequestTargetStatus targetStatus, IReadOnlyList<string>? myCategoryKeys, CancellationToken ct)
    {
        var allItems = JsonSerializer.Deserialize<List<QuotationItemLine>>(request.ItemsJson) ?? [];
        var shownItems = myCategoryKeys is null
            ? allItems
            : allItems.Where(i => myCategoryKeys.Contains(MarketplaceCategoryHelper.CategoryKeyOf(i.ItemKey))).ToList();

        var competingShopCount = await CompetingShopCountAsync(request.Id, shownItems, ct);

        return new IncomingQuotationRequestDto(
            request.Id,
            shownItems,
            request.Notes,
            request.CreatedAt,
            targetStatus,
            targetStatus == QuotationRequestTargetStatus.Quoted,
            allItems.Count - shownItems.Count,
            request.QuotesCloseAt,
            competingShopCount);
    }

    // How many OTHER targeted shops also cover at least one of the categories shown to this shop —
    // a count only, never names or prices, preserving blind bidding.
    private async Task<int> CompetingShopCountAsync(Guid requestId, IReadOnlyList<QuotationItemLine> shownItems, CancellationToken ct)
    {
        var myCategories = shownItems.Select(i => MarketplaceCategoryHelper.CategoryKeyOf(i.ItemKey)).Distinct().ToList();
        if (myCategories.Count == 0)
        {
            return 0;
        }

        var otherShopIds = await db.QuotationRequestShopTargets.AsNoTracking()
            .Where(t => t.QuotationRequestId == requestId && t.ShopUserId != currentUser.UserId)
            .Select(t => t.ShopUserId)
            .ToListAsync(ct);
        if (otherShopIds.Count == 0)
        {
            return 0;
        }

        var otherCategoryJson = await db.ShopProfiles.AsNoTracking()
            .Where(p => otherShopIds.Contains(p.UserId))
            .Select(p => p.ServedCategoryKeysJson)
            .ToListAsync(ct);

        // Shops without a ShopProfile row yet (never saved one) see everything, same as MyServedCategoryKeysAsync's
        // fallback — treat them as always competing since we can't know their categories.
        var configuredShops = otherCategoryJson.Count;
        var unconfiguredShops = otherShopIds.Count - configuredShops;

        var competingConfigured = otherCategoryJson.Count(json =>
        {
            var keys = MarketplaceCategoryHelper.DeserializeCategoryKeys(json);
            return keys.Count == 0 || keys.Intersect(myCategories).Any();
        });

        return competingConfigured + unconfiguredShops;
    }

    private static QuoteDto ToDto(
        Quote quote, string shopName, string? shopPhone = null, string? customerName = null, string? customerPhone = null)
    {
        var isAccepted = quote.Status == QuoteStatus.Accepted;
        return new QuoteDto(
            quote.Id,
            quote.QuotationRequestId,
            quote.ShopUserId,
            shopName,
            quote.Status,
            JsonSerializer.Deserialize<List<QuoteItemLine>>(quote.ItemsJson) ?? [],
            quote.TotalAmount,
            quote.DeliveryChargeAmount,
            quote.EstimatedDeliveryMinutes,
            quote.ValidUntil,
            quote.Note,
            quote.CreatedAt,
            isAccepted ? quote.FulfillmentStatus : null,
            isAccepted ? MarketplaceCategoryHelper.DeserializeCategoryKeys(quote.PackedItemKeysJson) : [],
            shopPhone,
            isAccepted ? customerName : null,
            isAccepted ? customerPhone : null);
    }
}
