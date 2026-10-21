using System.Text.Json;
using Gurtundaa.Application.Common;
using Gurtundaa.Application.Marketplace;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Marketplace;

public class QuotationRequestService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock, IQuoteService quotes)
    : IQuotationRequestService
{
    private IQueryable<QuotationRequest> Mine => db.QuotationRequests.Where(r => r.CustomerUserId == currentUser.UserId);

    public async Task<QuotationRequestDto> SubmitAsync(SubmitQuotationRequest request, CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var quotationRequest = new QuotationRequest
        {
            CustomerUserId = currentUser.UserId,
            ItemsJson = JsonSerializer.Serialize(request.Items),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            QuotesCloseAt = request.QuotesCloseAt,
            CreatedAt = now,
        };
        db.QuotationRequests.Add(quotationRequest);

        foreach (var shopUserId in request.ShopUserIds.Distinct())
        {
            db.QuotationRequestShopTargets.Add(new QuotationRequestShopTarget
            {
                QuotationRequestId = quotationRequest.Id,
                ShopUserId = shopUserId,
            });
        }

        await db.SaveChangesAsync(ct);
        return ToDto(quotationRequest, quoteCount: 0, lowestQuoteAmount: null);
    }

    public async Task<IReadOnlyList<QuotationRequestDto>> ListAsync(CancellationToken ct)
    {
        var requests = await Mine.OrderByDescending(r => r.CreatedAt).ToListAsync(ct);
        var requestIds = requests.Select(r => r.Id).ToList();

        var summaries = await db.Quotes
            .Where(q => requestIds.Contains(q.QuotationRequestId))
            .GroupBy(q => q.QuotationRequestId)
            .Select(g => new { RequestId = g.Key, Count = g.Count(), Lowest = g.Min(q => q.TotalAmount) })
            .ToDictionaryAsync(s => s.RequestId, ct);

        return requests
            .Select(r => summaries.TryGetValue(r.Id, out var s)
                ? ToDto(r, s.Count, s.Lowest)
                : ToDto(r, 0, null))
            .ToList();
    }

    public async Task<QuotationRequestDetailDto?> GetDetailAsync(Guid id, CancellationToken ct)
    {
        var request = await Mine.SingleOrDefaultAsync(r => r.Id == id, ct);
        if (request is null)
        {
            return null;
        }

        var requestQuotes = await quotes.ListForRequestAsync(id, ct);
        var pendingShops = await PendingShopsAsync(id, ct);
        return ToDetailDto(request, requestQuotes, pendingShops);
    }

    public async Task<QuotationRequestDetailDto?> AcceptAsync(Guid id, AcceptQuoteRequest request, CancellationToken ct)
    {
        var quotationRequest = await Mine.SingleOrDefaultAsync(r => r.Id == id, ct);
        if (quotationRequest is null)
        {
            return null;
        }

        var requestQuotes = await db.Quotes.Where(q => q.QuotationRequestId == id).ToListAsync(ct);
        var accepted = requestQuotes.SingleOrDefault(q => q.Id == request.QuoteId);
        if (accepted is null)
        {
            return null;
        }

        // Only reject quotes that compete for the same items — a mixed-category request can have one
        // accepted quote per shop/category, each tracked as its own independent order from here on.
        var acceptedItemKeys = ItemKeysOf(accepted.ItemsJson).ToHashSet();

        var now = clock.GetUtcNow();
        accepted.Status = QuoteStatus.Accepted;
        accepted.FulfillmentStatus = FulfillmentStatus.Accepted;
        accepted.UpdatedAt = now;

        foreach (var quote in requestQuotes)
        {
            if (quote.Id == accepted.Id || quote.Status != QuoteStatus.Submitted)
            {
                continue;
            }

            if (ItemKeysOf(quote.ItemsJson).Any(acceptedItemKeys.Contains))
            {
                quote.Status = QuoteStatus.Rejected;
                quote.UpdatedAt = now;
            }
        }

        quotationRequest.AcceptedQuoteId = accepted.Id;

        var requestItemKeys = JsonSerializer.Deserialize<List<QuotationItemLine>>(quotationRequest.ItemsJson)?.Select(i => i.ItemKey) ?? [];
        var acceptedItemKeysSoFar = requestQuotes.Where(q => q.Status == QuoteStatus.Accepted).SelectMany(q => ItemKeysOf(q.ItemsJson)).ToHashSet();
        quotationRequest.Status = requestItemKeys.All(acceptedItemKeysSoFar.Contains)
            ? QuotationRequestStatus.Closed
            : QuotationRequestStatus.Open;

        await db.SaveChangesAsync(ct);

        var dtoQuotes = await quotes.ListForRequestAsync(id, ct);
        var pendingShops = await PendingShopsAsync(id, ct);
        return ToDetailDto(quotationRequest, dtoQuotes, pendingShops);
    }

    public async Task<IReadOnlyList<ShopSummaryDto>> ListShopsAsync(CancellationToken ct)
    {
        var shopUserIds = await db.Users.AsNoTracking()
            .Where(u => u.UserType == UserType.Shop)
            .Select(u => new { u.Id, u.DisplayName })
            .ToListAsync(ct);

        var profiles = await db.ShopProfiles.AsNoTracking()
            .Where(p => shopUserIds.Select(u => u.Id).Contains(p.UserId))
            .ToDictionaryAsync(p => p.UserId, ct);

        return shopUserIds
            .Select(u => profiles.TryGetValue(u.Id, out var profile)
                ? new ShopSummaryDto(u.Id, profile.ShopName, profile.City, MarketplaceCategoryHelper.DeserializeCategoryKeys(profile.ServedCategoryKeysJson))
                : new ShopSummaryDto(u.Id, u.DisplayName, null, []))
            .ToList();
    }

    // Targets that haven't produced a quote yet — surfaced to the customer as "waiting to confirm".
    private async Task<IReadOnlyList<PendingShopDto>> PendingShopsAsync(Guid requestId, CancellationToken ct)
    {
        var targets = await db.QuotationRequestShopTargets.AsNoTracking()
            .Where(t => t.QuotationRequestId == requestId && t.Status != QuotationRequestTargetStatus.Quoted)
            .ToListAsync(ct);
        if (targets.Count == 0)
        {
            return [];
        }

        var shopIds = targets.Select(t => t.ShopUserId).ToList();
        var profileNames = await db.ShopProfiles.AsNoTracking()
            .Where(p => shopIds.Contains(p.UserId))
            .ToDictionaryAsync(p => p.UserId, p => p.ShopName, ct);

        var missingIds = shopIds.Where(id => !profileNames.ContainsKey(id)).ToList();
        if (missingIds.Count > 0)
        {
            var fallbackNames = await db.Users.AsNoTracking()
                .Where(u => missingIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.DisplayName, ct);
            foreach (var (shopId, name) in fallbackNames)
            {
                profileNames[shopId] = name;
            }
        }

        return targets
            .Select(t => new PendingShopDto(t.ShopUserId, profileNames.GetValueOrDefault(t.ShopUserId, "a shop"), t.Status))
            .ToList();
    }

    private static IEnumerable<string> ItemKeysOf(string quoteItemsJson) =>
        (JsonSerializer.Deserialize<List<QuoteItemLine>>(quoteItemsJson) ?? []).Select(i => i.ItemKey);

    private static QuotationRequestDto ToDto(QuotationRequest request, int quoteCount, decimal? lowestQuoteAmount) => new(
        request.Id,
        request.Status,
        JsonSerializer.Deserialize<List<QuotationItemLine>>(request.ItemsJson) ?? [],
        request.Notes,
        request.AcceptedQuoteId,
        request.CreatedAt,
        quoteCount,
        lowestQuoteAmount,
        request.QuotesCloseAt);

    private static QuotationRequestDetailDto ToDetailDto(
        QuotationRequest request, IReadOnlyList<QuoteDto> quotes, IReadOnlyList<PendingShopDto> pendingShops) => new(
        request.Id,
        request.Status,
        JsonSerializer.Deserialize<List<QuotationItemLine>>(request.ItemsJson) ?? [],
        request.Notes,
        request.AcceptedQuoteId,
        request.CreatedAt,
        quotes,
        BuildComparison(quotes),
        pendingShops,
        request.QuotesCloseAt,
        BuildCategoryQuoteCounts(request, quotes));

    private static IReadOnlyList<CategoryQuoteCountDto> BuildCategoryQuoteCounts(QuotationRequest request, IReadOnlyList<QuoteDto> quotes)
    {
        var items = JsonSerializer.Deserialize<List<QuotationItemLine>>(request.ItemsJson) ?? [];
        var categoryKeys = items.Select(i => MarketplaceCategoryHelper.CategoryKeyOf(i.ItemKey)).Distinct();
        return categoryKeys
            .Select(key => new CategoryQuoteCountDto(key, quotes.Count(q => q.Items.Any(i => MarketplaceCategoryHelper.CategoryKeyOf(i.ItemKey) == key))))
            .ToList();
    }

    // Only meaningful once 2+ shops have quoted — otherwise there's nothing to compare.
    private static PriceComparisonDto? BuildComparison(IReadOnlyList<QuoteDto> quotes)
    {
        if (quotes.Count < 2)
        {
            return null;
        }

        var rows = quotes
            .SelectMany(q => q.Items.Select(i => (q.ShopUserId, i.ItemKey, i.Name, i.UnitPrice)))
            .GroupBy(x => (x.ItemKey, x.Name))
            .Select(g =>
            {
                var priceByShop = g.ToDictionary(x => x.ShopUserId, x => (decimal?)x.UnitPrice);
                var cheapestShopUserId = priceByShop
                    .Where(p => p.Value.HasValue)
                    .OrderBy(p => p.Value)
                    .Select(p => (Guid?)p.Key)
                    .FirstOrDefault();
                return new ItemPriceRowDto(g.Key.ItemKey, g.Key.Name, priceByShop, cheapestShopUserId);
            })
            .ToList();

        var cheapestTotal = quotes.OrderBy(q => q.TotalAmount).First();
        return new PriceComparisonDto(rows, cheapestTotal.ShopUserId, cheapestTotal.TotalAmount);
    }
}
