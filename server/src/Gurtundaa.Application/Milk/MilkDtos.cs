using System.ComponentModel.DataAnnotations;
using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Application.Milk;

public sealed record MilkSubscriptionDto(
    Guid? ContactId,
    string? ContactName,
    string? ContactPhone,
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

public sealed record MilkMonthSummaryDto(int Planned, int Delivered, int Paused, int Missed);

public sealed record MilkMonthDto(IReadOnlyList<MilkCalendarDayDto> Days, MilkMonthSummaryDto Summary);

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

public sealed record MilkExtraRequestDto(Guid Id, DateOnly Date, MilkSlot Slot, decimal QuantityLtr, string? Reason, DateTimeOffset CreatedAt);

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
    DateTimeOffset OccurredAt);
