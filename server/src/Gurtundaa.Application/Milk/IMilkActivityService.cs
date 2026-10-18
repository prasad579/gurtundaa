namespace Gurtundaa.Application.Milk;

public interface IMilkActivityService
{
    Task<IReadOnlyList<MilkActivityItemDto>> GetRecentAsync(int take, CancellationToken ct);
}
