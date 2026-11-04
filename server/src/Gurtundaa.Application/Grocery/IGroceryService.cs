namespace Gurtundaa.Application.Grocery;

public interface IGroceryService
{
    Task<IReadOnlyList<GroceryItemDto>> ListAsync(CancellationToken ct);

    Task<GroceryItemDto> CreateAsync(SaveGroceryItemRequest request, CancellationToken ct);

    Task<GroceryItemDto?> SetCheckedAsync(Guid id, bool isChecked, CancellationToken ct);

    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
}
