namespace Gurtundaa.Application.Health;

public interface IPrescriptionService
{
    Task<IReadOnlyList<PrescriptionDto>> ListAsync(CancellationToken ct);

    Task<PrescriptionDto> CreateAsync(SavePrescriptionRequest request, CancellationToken ct);

    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
}
