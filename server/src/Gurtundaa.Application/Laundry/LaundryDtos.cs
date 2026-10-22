using System.ComponentModel.DataAnnotations;
using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Application.Laundry;

public sealed record LaundryItemLine(
    [Required, MaxLength(50)] string ItemType,
    [Range(1, 999)] int Quantity,
    decimal? PricePerItem = null,
    // Lets a specific item (e.g. school uniform) be flagged for an earlier pickup than the rest
    // of the batch's ExpectedReturn — surfaced as a "Special Reminder" separate from the batch date.
    DateOnly? NeededBy = null,
    // Per-item settlement, for batches picked up/settled in stages. The batch's own IsPaid is
    // derived from this — true only once every item here is.
    bool IsPaid = false);

public sealed record LaundryBatchDto(
    Guid Id,
    Guid? ContactId,
    string? ContactName,
    string? ContactPhone,
    LaundryServiceType ServiceType,
    DateOnly GivenOn,
    DateOnly? ExpectedReturn,
    LaundryBatchStatus Status,
    DateOnly? PickedUpOn,
    decimal? Amount,
    bool IsPaid,
    DateTimeOffset? PaidAt,
    IReadOnlyList<LaundryItemLine> Items,
    string? Notes,
    DateTimeOffset CreatedAt);

public sealed record SaveLaundryBatchRequest(
    Guid? ContactId,
    LaundryServiceType ServiceType,
    DateOnly GivenOn,
    DateOnly? ExpectedReturn,
    [MinLength(1)] IReadOnlyList<LaundryItemLine> Items,
    [MaxLength(200)] string? Notes);

public sealed record MarkPickedUpRequest(decimal? Amount, IReadOnlyList<LaundryItemLine>? Items = null);

public sealed record SetLaundryPaidRequest(bool IsPaid);

public sealed record SetLaundryItemPaidRequest(bool IsPaid);
