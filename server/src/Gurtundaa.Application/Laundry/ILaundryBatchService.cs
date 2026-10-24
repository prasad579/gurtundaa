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

    /// <summary>Settles the whole batch at once — also sets every item's own IsPaid to match.</summary>
    Task<LaundryBatchDto?> SetPaidAsync(Guid id, SetLaundryPaidRequest request, CancellationToken ct);

    /// <summary>Settles a single item line (by its position in the batch) for batches paid off in stages. The batch's own IsPaid becomes true once every item is.</summary>
    Task<LaundryBatchDto?> SetItemPaidAsync(Guid id, int itemIndex, SetLaundryItemPaidRequest request, CancellationToken ct);

    Task<LaundryBatchDto?> UploadPhotoAsync(Guid id, Stream content, string extension, CancellationToken ct);

    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
}
