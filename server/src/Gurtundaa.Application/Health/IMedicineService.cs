namespace Gurtundaa.Application.Health;

public interface IMedicineService
{
    Task<IReadOnlyList<MedicineDto>> ListAsync(CancellationToken ct);

    Task<MedicineDto> CreateAsync(SaveMedicineRequest request, CancellationToken ct);

    Task<MedicineDto?> UpdateAsync(Guid id, SaveMedicineRequest request, CancellationToken ct);

    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
}
