using System.ComponentModel.DataAnnotations;

namespace Gurtundaa.Application.Grocery;

public sealed record GroceryItemDto(
    Guid Id,
    string Name,
    bool IsChecked,
    DayOfWeek? RecurringWeekday,
    DateTimeOffset CreatedAt);

public sealed record SaveGroceryItemRequest(
    [Required, MaxLength(100)] string Name,
    DayOfWeek? RecurringWeekday = null);

public sealed record SetGroceryItemCheckedRequest(bool IsChecked);
