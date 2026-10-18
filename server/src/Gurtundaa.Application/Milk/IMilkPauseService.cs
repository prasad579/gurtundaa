namespace Gurtundaa.Application.Milk;

public interface IMilkPauseService
{
    Task<IReadOnlyList<MilkPauseDto>> ListAsync(bool upcomingOnly, CancellationToken ct);

    Task<MilkPauseDto> CreateAsync(SaveMilkPauseRequest request, CancellationToken ct);

    Task<MilkPauseDto?> UpdateAsync(Guid id, SaveMilkPauseRequest request, CancellationToken ct);

    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
}
