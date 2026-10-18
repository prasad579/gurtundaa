using System.ComponentModel.DataAnnotations;
using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Application.Laundry;

public sealed record LaundryItemLine(
    [Required, MaxLength(50)] string ItemType,
    [Range(1, 999)] int Quantity,
    decimal? PricePerItem = null);

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
