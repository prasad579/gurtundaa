namespace Gurtundaa.Application.Milk;

public interface IMilkQuantityChangeService
{
    Task<IReadOnlyList<MilkQuantityChangeDto>> ListAsync(bool upcomingOnly, CancellationToken ct);

    Task<MilkQuantityChangeDto> CreateAsync(SaveMilkQuantityChangeRequest request, CancellationToken ct);

    Task<MilkQuantityChangeDto?> UpdateAsync(Guid id, SaveMilkQuantityChangeRequest request, CancellationToken ct);

    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
}
