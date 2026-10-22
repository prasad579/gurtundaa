using System.ComponentModel.DataAnnotations;

namespace Gurtundaa.Application.Shop;

public sealed record ShopProfileDto(
    string ShopName,
    string? City,
    string? Address,
    IReadOnlyList<string> ServedCategoryKeys,
    string? ImageUrl,
    IReadOnlyList<string> ContactPhones,
    TimeOnly? OpensAt,
    TimeOnly? ClosesAt,
    IReadOnlyList<DayOfWeek> OpenDays,
    decimal? Latitude,
    decimal? Longitude);

public sealed record SaveShopProfileRequest(
    [Required, MaxLength(100)] string ShopName,
    [MaxLength(100)] string? City,
    [MaxLength(200)] string? Address,
    IReadOnlyList<string> ServedCategoryKeys,
    [MaxLength(10)] IReadOnlyList<string> ContactPhones,
    TimeOnly? OpensAt,
    TimeOnly? ClosesAt,
    IReadOnlyList<DayOfWeek> OpenDays,
    [Range(-90, 90)] decimal? Latitude,
    [Range(-180, 180)] decimal? Longitude);

public sealed record UploadShopImageResponse(string ImageUrl);
