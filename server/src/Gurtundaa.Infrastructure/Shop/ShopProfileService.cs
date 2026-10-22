using System.Text.Json;
using Gurtundaa.Application.Common;
using Gurtundaa.Application.Marketplace;
using Gurtundaa.Application.Shop;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Shop;

public class ShopProfileService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock, IHostEnvironment env) : IShopProfileService
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
        profile.ContactPhonesJson = JsonSerializer.Serialize(request.ContactPhones.Select(p => p.Trim()).Where(p => p.Length > 0).Distinct());
        profile.OpensAt = request.OpensAt;
        profile.ClosesAt = request.ClosesAt;
        profile.OpenDaysJson = JsonSerializer.Serialize(request.OpenDays.Select(d => (int)d).Distinct());
        profile.Latitude = request.Latitude;
        profile.Longitude = request.Longitude;
        profile.UpdatedAt = clock.GetUtcNow();

        await db.SaveChangesAsync(ct);
        return ToDto(profile);
    }

    public async Task<UploadShopImageResponse> UploadImageAsync(Stream content, string extension, CancellationToken ct)
    {
        var profile = await Mine().SingleOrDefaultAsync(ct);
        if (profile is null)
        {
            profile = new ShopProfile { UserId = currentUser.UserId };
            db.ShopProfiles.Add(profile);
        }

        var uploadsDir = Path.Combine(env.ContentRootPath, "wwwroot", "uploads", "shops");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{currentUser.UserId}{extension}";
        var fullPath = Path.Combine(uploadsDir, fileName);
        await using (var fileStream = new FileStream(fullPath, FileMode.Create))
        {
            await content.CopyToAsync(fileStream, ct);
        }

        profile.ImageUrl = $"/uploads/shops/{fileName}";
        profile.UpdatedAt = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);

        return new UploadShopImageResponse(profile.ImageUrl);
    }

    private IQueryable<ShopProfile> Mine() => db.ShopProfiles.Where(p => p.UserId == currentUser.UserId);

    private static ShopProfileDto ToDto(ShopProfile profile) => new(
        profile.ShopName,
        profile.City,
        profile.Address,
        MarketplaceCategoryHelper.DeserializeCategoryKeys(profile.ServedCategoryKeysJson),
        profile.ImageUrl,
        MarketplaceCategoryHelper.DeserializeCategoryKeys(profile.ContactPhonesJson),
        profile.OpensAt,
        profile.ClosesAt,
        DeserializeOpenDays(profile.OpenDaysJson),
        profile.Latitude,
        profile.Longitude);

    private static List<DayOfWeek> DeserializeOpenDays(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        var ints = JsonSerializer.Deserialize<List<int>>(json) ?? [];
        return ints.Select(i => (DayOfWeek)i).ToList();
    }
}
