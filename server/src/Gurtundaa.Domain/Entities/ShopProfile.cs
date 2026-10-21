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

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
