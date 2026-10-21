using System.ComponentModel.DataAnnotations;

namespace Gurtundaa.Application.Shop;

public sealed record ShopProfileDto(string ShopName, string? City, string? Address, IReadOnlyList<string> ServedCategoryKeys);

public sealed record SaveShopProfileRequest(
    [Required, MaxLength(100)] string ShopName,
    [MaxLength(100)] string? City,
    [MaxLength(200)] string? Address,
    IReadOnlyList<string> ServedCategoryKeys);
