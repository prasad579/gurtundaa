using System.Linq.Expressions;
using Gurtundaa.Application.Common;
using Gurtundaa.Application.Grocery;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Grocery;

public class GroceryService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IGroceryService
{
    private static readonly Expression<Func<GroceryItem, GroceryItemDto>> ToDtoExpression =
        g => new GroceryItemDto(g.Id, g.Name, g.IsChecked, g.RecurringWeekday, g.CreatedAt);

    private IQueryable<GroceryItem> Mine => db.GroceryItems.Where(g => g.UserId == currentUser.UserId);

    public async Task<IReadOnlyList<GroceryItemDto>> ListAsync(CancellationToken ct) =>
        await Mine.AsNoTracking().OrderBy(g => g.IsChecked).ThenByDescending(g => g.CreatedAt).Select(ToDtoExpression).ToListAsync(ct);

    public async Task<GroceryItemDto> CreateAsync(SaveGroceryItemRequest request, CancellationToken ct)
    {
        var item = new GroceryItem
        {
            UserId = currentUser.UserId,
            Name = request.Name.Trim(),
            RecurringWeekday = request.RecurringWeekday,
            CreatedAt = clock.GetUtcNow(),
        };

        db.GroceryItems.Add(item);
        await db.SaveChangesAsync(ct);
        return new GroceryItemDto(item.Id, item.Name, item.IsChecked, item.RecurringWeekday, item.CreatedAt);
    }

    public async Task<GroceryItemDto?> SetCheckedAsync(Guid id, bool isChecked, CancellationToken ct)
    {
        var item = await Mine.SingleOrDefaultAsync(g => g.Id == id, ct);
        if (item is null)
        {
            return null;
        }

        item.IsChecked = isChecked;
        await db.SaveChangesAsync(ct);
        return new GroceryItemDto(item.Id, item.Name, item.IsChecked, item.RecurringWeekday, item.CreatedAt);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct) =>
        await Mine.Where(g => g.Id == id).ExecuteDeleteAsync(ct) > 0;
}
