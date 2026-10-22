namespace Gurtundaa.Domain.Entities;

public class ShopProfile
{
    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    public string ShopName { get; set; } = string.Empty;

    public string? City { get; set; }

    public string? Address { get; set; }

    /// <summary>System.Text.Json-serialized <c>List&lt;string&gt;</c> of marketplace catalog category keys this shop sells — same JSON-blob-on-entity precedent as QuotationRequest.ItemsJson.</summary>
    public string ServedCategoryKeysJson { get; set; } = "[]";

    /// <summary>System.Text.Json-serialized <c>Dictionary&lt;string, decimal&gt;</c> (itemKey -> this shop's saved price) — prefills quote forms.</summary>
    public string PriceListJson { get; set; } = "{}";

    /// <summary>Relative URL under wwwroot (e.g. "/uploads/shops/{userId}.jpg") — null until the shop uploads a photo.</summary>
    public string? ImageUrl { get; set; }

    /// <summary>System.Text.Json-serialized <c>List&lt;string&gt;</c> of customer-facing contact numbers (may differ from the shop's login phone).</summary>
    public string ContactPhonesJson { get; set; } = "[]";

    public TimeOnly? OpensAt { get; set; }

    public TimeOnly? ClosesAt { get; set; }

    /// <summary>System.Text.Json-serialized <c>List&lt;int&gt;</c> of <see cref="DayOfWeek"/> values the shop is open — empty means open every day.</summary>
    public string OpenDaysJson { get; set; } = "[]";

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
