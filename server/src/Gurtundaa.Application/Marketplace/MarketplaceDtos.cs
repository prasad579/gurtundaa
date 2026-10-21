using System.ComponentModel.DataAnnotations;
using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Application.Marketplace;

public sealed record QuotationItemLine(
    [Required, MaxLength(50)] string ItemKey,
    [Required, MaxLength(100)] string Name,
    [Range(1, 999)] int Qty,
    [MaxLength(30)] string Pack);

public sealed record QuoteItemLine(string ItemKey, string Name, int Qty, string Pack, decimal UnitPrice);

public sealed record SubmitQuotationRequest(
    [MinLength(1)] IReadOnlyList<QuotationItemLine> Items,
    [MaxLength(500)] string? Notes,
    // May be empty: a request can go out purely via WhatsApp to shops that aren't registered yet
    // (see QuotationRequestShopTarget — those aren't persisted since there's no in-app reply to track).
    IReadOnlyList<Guid> ShopUserIds,
    DateTimeOffset? QuotesCloseAt);

public sealed record CategoryQuoteCountDto(string CategoryKey, int QuoteCount);

public sealed record QuotationRequestDto(
    Guid Id,
    QuotationRequestStatus Status,
    IReadOnlyList<QuotationItemLine> Items,
    string? Notes,
    Guid? AcceptedQuoteId,
    DateTimeOffset CreatedAt,
    int QuoteCount,
    decimal? LowestQuoteAmount,
    DateTimeOffset? QuotesCloseAt);

public sealed record QuoteDto(
    Guid Id,
    Guid QuotationRequestId,
    Guid ShopUserId,
    string ShopName,
    QuoteStatus Status,
    IReadOnlyList<QuoteItemLine> Items,
    decimal TotalAmount,
    decimal DeliveryChargeAmount,
    int? EstimatedDeliveryMinutes,
    DateTimeOffset? ValidUntil,
    string? Note,
    DateTimeOffset CreatedAt,
    FulfillmentStatus? FulfillmentStatus,
    IReadOnlyList<string> PackedItemKeys,
    // Privacy-gated: ShopPhone only set for the customer's view; CustomerName/CustomerPhone only set
    // for the shop's view of its own quote, and only once Status == Accepted ("phone shared only
    // after you win the order").
    string? ShopPhone,
    string? CustomerName,
    string? CustomerPhone);

public sealed record TogglePackedItemRequest([Required, MaxLength(50)] string ItemKey);

public sealed record AdvanceFulfillmentRequest(FulfillmentStatus Status);

public sealed record QuotationRequestDetailDto(
    Guid Id,
    QuotationRequestStatus Status,
    IReadOnlyList<QuotationItemLine> Items,
    string? Notes,
    Guid? AcceptedQuoteId,
    DateTimeOffset CreatedAt,
    IReadOnlyList<QuoteDto> Quotes,
    PriceComparisonDto? Comparison,
    IReadOnlyList<PendingShopDto> PendingShops,
    DateTimeOffset? QuotesCloseAt,
    IReadOnlyList<CategoryQuoteCountDto> CategoryQuoteCounts);

/// <summary>A targeted shop that hasn't submitted a quote yet — shown to the customer as "waiting to confirm".</summary>
public sealed record PendingShopDto(Guid ShopUserId, string ShopName, QuotationRequestTargetStatus Status);

public sealed record ItemPriceRowDto(
    string ItemKey, string Name, IReadOnlyDictionary<Guid, decimal?> PriceByShop, Guid? CheapestShopUserId);

/// <summary>Computed purely on read from the request's quotes — null until at least 2 shops have quoted.</summary>
public sealed record PriceComparisonDto(
    IReadOnlyList<ItemPriceRowDto> Rows, Guid CheapestTotalShopUserId, decimal CheapestTotalAmount);

public sealed record AcceptQuoteRequest(Guid QuoteId);

public sealed record ShopSummaryDto(Guid UserId, string ShopName, string? City, IReadOnlyList<string> ServedCategoryKeys);

public sealed record SubmitQuoteItemLine([Required, MaxLength(50)] string ItemKey, [Range(0.01, 10_000_000)] decimal UnitPrice);

public sealed record SubmitQuoteRequest(
    [MinLength(1)] IReadOnlyList<SubmitQuoteItemLine> Items,
    [MaxLength(300)] string? Note,
    [Range(0, 10_000)] decimal DeliveryChargeAmount,
    [Range(1, 1440)] int? EstimatedDeliveryMinutes,
    DateTimeOffset? ValidUntil);

public sealed record ShopPriceListItemDto([Required, MaxLength(50)] string ItemKey, [Range(0.01, 10_000_000)] decimal UnitPrice);

public sealed record SavePriceListRequest(IReadOnlyList<ShopPriceListItemDto> Items);

/// <summary>One learned/saved price, with enough history (previous price + when last touched) to show "↑ ₹5 from last" and staleness in the My Price List screen.</summary>
public sealed record PriceListEntryDto(string ItemKey, decimal UnitPrice, decimal? PreviousUnitPrice, DateTimeOffset UpdatedAt);

public sealed record IncomingQuotationRequestDto(
    Guid Id,
    IReadOnlyList<QuotationItemLine> Items,
    string? Notes,
    DateTimeOffset CreatedAt,
    QuotationRequestTargetStatus TargetStatus,
    bool HasQuoted,
    int OtherItemsCount,
    DateTimeOffset? QuotesCloseAt,
    int CompetingShopCount);

/// <summary>
/// Category is encoded in every catalog itemKey as "&lt;categoryKey&gt;:&lt;slug&gt;" (see marketplace-catalog.ts's
/// `category()` helper) — this recovers it server-side without needing a redundant field on QuotationItemLine.
/// </summary>
public static class MarketplaceCategoryHelper
{
    public static string CategoryKeyOf(string itemKey) => itemKey.Split(':')[0];

    // Defensive: a bare `AddColumn` migration for an existing table backfills the CLR default ("")
    // for a non-nullable string, not the C# property initializer ("[]") — existing rows can end up
    // with an empty string here rather than valid JSON, so treat blank as "no categories" instead
    // of letting System.Text.Json throw.
    public static List<string> DeserializeCategoryKeys(string? json) =>
        string.IsNullOrWhiteSpace(json) ? [] : System.Text.Json.JsonSerializer.Deserialize<List<string>>(json) ?? [];

    public static Dictionary<string, PriceListEntryDto> DeserializePriceList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, PriceListEntryDto>>(json) ?? [];
        }
        catch (System.Text.Json.JsonException)
        {
            // Pre-history shape (just itemKey -> price, no PreviousUnitPrice/UpdatedAt) — best-effort upgrade.
            var legacy = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, decimal>>(json) ?? [];
            return legacy.ToDictionary(kv => kv.Key, kv => new PriceListEntryDto(kv.Key, kv.Value, null, DateTimeOffset.UtcNow));
        }
    }

    /// <summary>Upserts one price: only records a PreviousUnitPrice when the price actually changed, but always refreshes UpdatedAt so "confirmed same price today" still counts as fresh.</summary>
    public static PriceListEntryDto UpsertPriceListEntry(PriceListEntryDto? existing, string itemKey, decimal newPrice, DateTimeOffset now)
    {
        if (existing is null)
        {
            return new PriceListEntryDto(itemKey, newPrice, null, now);
        }

        return existing.UnitPrice == newPrice
            ? existing with { UpdatedAt = now }
            : new PriceListEntryDto(itemKey, newPrice, existing.UnitPrice, now);
    }
}
