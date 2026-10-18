namespace Gurtundaa.Application.Milk;

public interface IMilkExtraRequestService
{
    Task<IReadOnlyList<MilkExtraRequestDto>> ListAsync(bool upcomingOnly, CancellationToken ct);

    Task<MilkExtraRequestDto> CreateAsync(SaveMilkExtraRequestRequest request, CancellationToken ct);

    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
}
