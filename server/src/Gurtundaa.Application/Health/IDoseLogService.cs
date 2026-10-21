using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Application.Health;

public interface IDoseLogService
{
    Task<IReadOnlyList<DoseEntryDto>> GetTodayAsync(CancellationToken ct);

    Task<DoseEntryDto?> SetStatusAsync(Guid medicineId, DateOnly date, DoseSlot slot, SetDoseStatusRequest request, CancellationToken ct);
}
