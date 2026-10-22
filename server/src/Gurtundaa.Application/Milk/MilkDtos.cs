using System.ComponentModel.DataAnnotations;
using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Application.Milk;

public sealed record MilkSubscriptionDto(
    Guid? ContactId,
    string? ContactName,
    string? ContactPhone,
    bool IsSelfCollected,
    DateOnly StartDate,
    bool MorningEnabled,
    decimal MorningQuantityLtr,
    TimeOnly? MorningWindowStart,
    TimeOnly? MorningWindowEnd,
    bool EveningEnabled,
    decimal EveningQuantityLtr,
    TimeOnly? EveningWindowStart,
    TimeOnly? EveningWindowEnd,
    decimal RatePerLtr,
    MilkSettlementCycle SettlementCycle,
    DateTimeOffset UpdatedAt);

public sealed record SaveMilkSubscriptionRequest(
    Guid? ContactId,
    bool IsSelfCollected,
    [Required] DateOnly StartDate,
    bool MorningEnabled,
    [Range(0, 50)] decimal MorningQuantityLtr,
    TimeOnly? MorningWindowStart,
    TimeOnly? MorningWindowEnd,
    bool EveningEnabled,
    [Range(0, 50)] decimal EveningQuantityLtr,
    TimeOnly? EveningWindowStart,
    TimeOnly? EveningWindowEnd,
    [Range(0.1, 500)] decimal RatePerLtr,
    MilkSettlementCycle SettlementCycle = MilkSettlementCycle.Monthly);

public enum MilkCalendarStatus
{
    Delivered,
    Missed,
    Paused,
}

public sealed record MilkSlotStateDto(bool Enabled, MilkCalendarStatus Status, decimal QuantityLtr, bool HasExtra);

public sealed record MilkCalendarDayDto(DateOnly Date, MilkCalendarStatus Status, MilkSlotStateDto Morning, MilkSlotStateDto Evening);

public sealed record MilkMonthSummaryDto(
    int Planned,
    int Delivered,
    int Paused,
    int Missed,
    decimal RegularLitres,
    decimal ExtraLitres,
    decimal RatePerLtr,
    decimal RegularAmount,
    decimal ExtraAmount,
    decimal TotalAmount,
    bool IsPaid,
    DateTimeOffset? PaidAt,
    /// <summary>Sum of this month's logged <see cref="MilkPaymentDto"/> rows — lets partial daily/weekly payments show alongside the all-or-nothing monthly toggle above.</summary>
    decimal PaidSoFar = 0);

public sealed record MilkMonthDto(IReadOnlyList<MilkCalendarDayDto> Days, MilkMonthSummaryDto Summary);

public sealed record MilkPaymentDto(
    Guid Id,
    DateOnly Date,
    decimal Amount,
    string? Note,
    PaymentMethod Method,
    PaymentStatus Status,
    DateTimeOffset CreatedAt);

public sealed record SaveMilkPaymentRequest(
    [Required] DateOnly Date,
    [Range(0.01, 1_000_000)] decimal Amount,
    [MaxLength(200)] string? Note);

// ---------- Direct UPI payments (customer pays the provider's own UPI ID; Gurtundaa never touches the money) ----------

/// <summary>What the household needs to build a `upi://pay` link for their linked milk provider — null fields mean "can't pay via UPI yet" (not linked, or linked but provider hasn't set one up).</summary>
public sealed record MilkProviderPaymentInfoDto(string? ProviderDisplayName, string? UpiId);

public sealed record InitiateUpiPaymentRequest(
    [Range(0.01, 1_000_000)] decimal Amount,
    [MaxLength(200)] string? Note);

/// <summary>A household's UPI payment still awaiting (or rejected from) their provider's confirmation — shown alongside the household name on the provider's side.</summary>
public sealed record PendingMilkPaymentDto(Guid Id, Guid HouseholdUserId, string HouseholdName, DateOnly Date, decimal Amount, string? Note, DateTimeOffset CreatedAt);

public sealed record SetMilkSettlementPaidRequest(bool IsPaid);

public sealed record MilkTodayDto(DateOnly Date, MilkSlotStateDto Morning, MilkSlotStateDto Evening, bool IsAuto);

public sealed record SetMilkDeliveryOverrideRequest(
    MilkSlot Slot,
    MilkDeliveryStatus Status,
    decimal? QuantityLtr,
    [MaxLength(200)] string? Note);

public sealed record MilkPauseDto(Guid Id, DateOnly StartDate, DateOnly EndDate, string? Reason, DateTimeOffset CreatedAt);

public sealed record SaveMilkPauseRequest(
    [Required] DateOnly StartDate,
    [Required] DateOnly EndDate,
    [MaxLength(200)] string? Reason);

public sealed record MilkQuantityChangeDto(
    Guid Id,
    DateOnly StartDate,
    DateOnly EndDate,
    decimal MorningQuantityLtr,
    decimal EveningQuantityLtr,
    string? Reason,
    DateTimeOffset CreatedAt);

public sealed record SaveMilkQuantityChangeRequest(
    [Required] DateOnly StartDate,
    [Required] DateOnly EndDate,
    [Range(0, 50)] decimal MorningQuantityLtr,
    [Range(0, 50)] decimal EveningQuantityLtr,
    [MaxLength(200)] string? Reason);

public sealed record MilkExtraRequestDto(
    Guid Id,
    DateOnly Date,
    MilkSlot Slot,
    decimal QuantityLtr,
    string? Reason,
    DateTimeOffset CreatedAt,
    string? AddedByProviderName = null);

public sealed record SaveMilkExtraRequestRequest(
    [Required] DateOnly Date,
    MilkSlot Slot,
    [Range(0.1, 50)] decimal QuantityLtr,
    [MaxLength(200)] string? Reason);

public enum MilkActivityType
{
    Delivered,
    Missed,
    ExtraAdded,
    Paused,
}

public sealed record MilkActivityItemDto(
    MilkActivityType Type,
    string Description,
    DateOnly Date,
    decimal? QuantityLtr,
    DateTimeOffset OccurredAt,
    string? AddedByProviderName = null);
