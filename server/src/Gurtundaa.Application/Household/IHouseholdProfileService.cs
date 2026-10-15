namespace Gurtundaa.Application.Household;

public interface IHouseholdProfileService
{
    Task<HouseholdProfileDto?> GetAsync(CancellationToken ct);

    Task<HouseholdProfileDto> SaveAsync(SaveHouseholdProfileRequest request, CancellationToken ct);
}
