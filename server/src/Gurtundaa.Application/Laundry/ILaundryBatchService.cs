namespace Gurtundaa.Application.Laundry;

public enum LaundryBatchFilter
{
    All,
    Active,
    PickedUp,
}

public interface ILaundryBatchService
{
    Task<IReadOnlyList<LaundryBatchDto>> ListAsync(LaundryBatchFilter filter, CancellationToken ct);

    Task<LaundryBatchDto> CreateAsync(SaveLaundryBatchRequest request, CancellationToken ct);

    Task<LaundryBatchDto?> UpdateAsync(Guid id, SaveLaundryBatchRequest request, CancellationToken ct);

    Task<LaundryBatchDto?> MarkPickedUpAsync(Guid id, MarkPickedUpRequest request, CancellationToken ct);

    Task<LaundryBatchDto?> SetPaidAsync(Guid id, SetLaundryPaidRequest request, CancellationToken ct);

    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
}
