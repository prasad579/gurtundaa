namespace Gurtundaa.Application.Health;

public interface IHouseholdMemberService
{
    Task<IReadOnlyList<HouseholdMemberDto>> ListAsync(CancellationToken ct);

    Task<HouseholdMemberDto> CreateAsync(SaveHouseholdMemberRequest request, CancellationToken ct);

    Task<HouseholdMemberDto?> UpdateAsync(Guid id, SaveHouseholdMemberRequest request, CancellationToken ct);

    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
}
