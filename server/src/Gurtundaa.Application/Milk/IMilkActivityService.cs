namespace Gurtundaa.Application.Milk;

public interface IMilkActivityService
{
    Task<IReadOnlyList<MilkActivityItemDto>> GetRecentAsync(int take, CancellationToken ct);

    /// <summary>Count of provider-added overrides/extras the household hasn't seen yet — drives the Milk tab badge.</summary>
    Task<int> GetUnseenProviderActivityCountAsync(CancellationToken ct);

    /// <summary>Marks all currently-unseen provider-added entries as seen — call when the household opens the Milk page.</summary>
    Task MarkProviderActivitySeenAsync(CancellationToken ct);
}
