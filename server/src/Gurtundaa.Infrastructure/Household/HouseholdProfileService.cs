using Gurtundaa.Application.Common;
using Gurtundaa.Application.Household;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Household;

public class HouseholdProfileService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IHouseholdProfileService
{
    public async Task<HouseholdProfileDto?> GetAsync(CancellationToken ct)
    {
        var profile = await Mine().AsNoTracking().SingleOrDefaultAsync(ct);
        return profile is null ? null : ToDto(profile);
    }

    public async Task<HouseholdProfileDto> SaveAsync(SaveHouseholdProfileRequest request, CancellationToken ct)
    {
        var profile = await Mine().SingleOrDefaultAsync(ct);
        if (profile is null)
        {
            profile = new HouseholdProfile { UserId = currentUser.UserId };
            db.HouseholdProfiles.Add(profile);
        }

        profile.AccountType = request.AccountType;
        profile.Adults = request.Adults;
        profile.Children = request.Children;
        profile.City = request.City?.Trim();
        profile.EnabledFeatures = string.Join(',', request.EnabledFeatures);
        profile.UpdatedAt = clock.GetUtcNow();

        await db.SaveChangesAsync(ct);
        return ToDto(profile);
    }

    private IQueryable<HouseholdProfile> Mine() => db.HouseholdProfiles.Where(p => p.UserId == currentUser.UserId);

    private static HouseholdProfileDto ToDto(HouseholdProfile profile) => new(
        profile.AccountType,
        profile.Adults,
        profile.Children,
        profile.City,
        profile.EnabledFeatures.Length == 0
            ? []
            : profile.EnabledFeatures.Split(',', StringSplitOptions.RemoveEmptyEntries));
}
