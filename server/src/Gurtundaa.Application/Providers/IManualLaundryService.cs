namespace Gurtundaa.Application.Providers;

public interface IManualLaundryService
{
    Task<IReadOnlyList<ManualLaundryBatchDto>> ListAsync(Guid providerCustomerId, CancellationToken ct);

    Task<ManualLaundryBatchDto?> CreateAsync(Guid providerCustomerId, SaveManualLaundryBatchRequest request, CancellationToken ct);

    Task<ManualLaundryBatchDto?> MarkPickedUpAsync(Guid batchId, MarkManualPickedUpRequest request, CancellationToken ct);

    Task<ManualLaundryBatchDto?> SetPaidAsync(Guid batchId, SetManualLaundryPaidRequest request, CancellationToken ct);

    Task<bool> DeleteAsync(Guid batchId, CancellationToken ct);
}
