using System.ComponentModel.DataAnnotations;
using Gurtundaa.Application.Laundry;
using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Application.Providers;

// ---------- Manual (off-app) customers ----------

public sealed record ProviderManualCustomerDto(
    Guid Id,
    string Name,
    string? Phone,
    string? Address,
    string? Notes,
    decimal? DefaultQuantityLtr,
    decimal? DefaultRatePerLtr,
    MilkSlot DefaultSlot,
    string? DefaultVariety,
    string? LinkCode,
    bool IsClaimed,
    string? ClaimedByName,
    DateTimeOffset CreatedAt);

public sealed record SaveProviderManualCustomerRequest(
    [Required, MaxLength(100)] string Name,
    [MaxLength(20)] string? Phone,
    [MaxLength(200)] string? Address,
    [MaxLength(500)] string? Notes,
    [Range(0.1, 500)] decimal? DefaultQuantityLtr = null,
    [Range(0.1, 500)] decimal? DefaultRatePerLtr = null,
    MilkSlot DefaultSlot = MilkSlot.Morning,
    [MaxLength(50)] string? DefaultVariety = null);

public sealed record ClaimProviderCustomerRequest([Required, MaxLength(12)] string LinkCode);

// ---------- Manual milk entries ----------

public sealed record ManualMilkEntryDto(
    Guid Id,
    DateOnly Date,
    MilkSlot Slot,
    string? Variety,
    decimal QuantityLtr,
    decimal RatePerLtr,
    decimal Amount,
    ManualMilkEntryKind Kind,
    string? Note,
    bool IsPaid);

public sealed record SaveManualMilkEntryRequest(
    [Required] DateOnly Date,
    MilkSlot Slot,
    [MaxLength(50)] string? Variety,
    [Range(0.1, 500)] decimal QuantityLtr,
    [Range(0.1, 500)] decimal RatePerLtr,
    bool IsPaid = false);

public sealed record AddManualMilkExtraRequest(
    [Required] DateOnly Date,
    MilkSlot Slot,
    [MaxLength(50)] string? Variety,
    [Range(0.1, 500)] decimal QuantityLtr,
    [Range(0.1, 500)] decimal RatePerLtr,
    [MaxLength(200)] string? Note);

public sealed record AddManualMilkReturnRequest(
    [Required] DateOnly Date,
    MilkSlot Slot,
    [MaxLength(50)] string? Variety,
    [Range(0.1, 500)] decimal QuantityLtr,
    [Range(0.1, 500)] decimal RatePerLtr,
    [MaxLength(200)] string? Note);

public sealed record SetManualMilkPaidRequest(bool IsPaid);

// ---------- Aggregate calendar across all manual milk customers ----------

public sealed record ManualMilkDaySummaryDto(DateOnly Date, int CustomerCount, decimal PlannedLitres, decimal LoggedLitres, decimal Amount);

public sealed record ManualMilkDayCustomerDto(
    Guid ProviderCustomerId,
    string CustomerName,
    decimal PlannedQuantityLtr,
    ManualMilkEntryDto? LoggedEntry);

// ---------- Manual laundry batches ----------

public sealed record ManualLaundryBatchDto(
    Guid Id,
    LaundryServiceType ServiceType,
    DateOnly GivenOn,
    DateOnly? ExpectedReturn,
    LaundryBatchStatus Status,
    DateOnly? PickedUpOn,
    decimal? Amount,
    bool IsPaid,
    IReadOnlyList<LaundryItemLine> Items,
    string? Notes,
    DateTimeOffset CreatedAt);

public sealed record SaveManualLaundryBatchRequest(
    LaundryServiceType ServiceType,
    [Required] DateOnly GivenOn,
    DateOnly? ExpectedReturn,
    [MinLength(1)] IReadOnlyList<LaundryItemLine> Items,
    [MaxLength(200)] string? Notes);

public sealed record MarkManualPickedUpRequest(decimal? Amount, IReadOnlyList<LaundryItemLine>? Items = null);

public sealed record SetManualLaundryPaidRequest(bool IsPaid);

// ---------- Laundry pickup requests (household asking their linked dhobi to collect) ----------

public sealed record LaundryPickupRequestDto(
    Guid Id,
    Guid HouseholdUserId,
    string HouseholdName,
    DateOnly RequestedDate,
    string? Note,
    DateTimeOffset CreatedAt,
    bool IsHandled);

public sealed record CreatePickupRequestRequest(
    [Required] Guid ServiceContactId,
    [Required] DateOnly RequestedDate,
    [MaxLength(200)] string? Note);
