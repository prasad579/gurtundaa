namespace Gurtundaa.Application.Bills;

public interface IBillService
{
    Task<IReadOnlyList<BillDto>> ListAsync(CancellationToken ct);

    Task<BillDto> CreateAsync(SaveBillRequest request, CancellationToken ct);

    Task<BillDto?> UpdateAsync(Guid id, SaveBillRequest request, CancellationToken ct);

    Task<BillDto?> SetPaidAsync(Guid id, SetBillPaidRequest request, CancellationToken ct);

    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
}
