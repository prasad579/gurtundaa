using System.ComponentModel.DataAnnotations;
using Gurtundaa.Application.Laundry;
using Gurtundaa.Application.Milk;
using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Application.Providers;

public sealed record ProviderLinkDto(
    Guid Id,
    Guid ServiceContactId,
    string ContactName,
    ServiceContactCategory Category,
    string InviteCode,
    bool IsClaimed,
    string? ProviderDisplayName,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ClaimedAt);

public sealed record CreateProviderInviteRequest([Required] Guid ServiceContactId);

public sealed record ClaimProviderInviteRequest([Required, MaxLength(12)] string InviteCode);

public sealed record ProviderCustomerDto(Guid HouseholdUserId, string HouseholdName, string? City, string? Phone, DateTimeOffset LinkedAt);

public sealed record ProviderLaundryTodayItemDto(
    Guid HouseholdUserId,
    string HouseholdName,
    Guid BatchId,
    string ItemsSummary,
    int ItemCount,
    decimal? Amount,
    bool IsPaid);

public sealed record ProviderLaundryDashboardDto(
    int CustomersToday,
    int ItemsGivenToday,
    decimal ExpectedToday,
    IReadOnlyList<ProviderLaundryTodayItemDto> GaveToday,
    decimal ReceivedThisMonth,
    decimal PendingThisMonth,
    IReadOnlyList<ProviderCustomerDto> Customers);

public sealed record ProviderLaundryCustomerDetailDto(
    Guid HouseholdUserId,
    string HouseholdName,
    string? City,
    IReadOnlyList<LaundryBatchDto> Active,
    IReadOnlyList<LaundryBatchDto> History);

public sealed record ProviderMilkTodayItemDto(
    Guid HouseholdUserId,
    string HouseholdName,
    decimal QuantityLtr,
    decimal Amount,
    MilkCalendarStatus Status);

public sealed record ProviderMilkDashboardDto(
    int ActiveCustomers,
    int DeliveredCustomers,
    int PausedCustomers,
    int MissedCustomers,
    int IncreasedQuantityCustomers,
    int DecreasedQuantityCustomers,
    decimal PlannedLitresToday,
    decimal TotalLitresToday,
    decimal ExpectedToday,
    IReadOnlyList<ProviderMilkTodayItemDto> DeliverToday,
    decimal TotalLitresThisMonth,
    int DeliveredDaysThisMonth,
    int PausedDaysThisMonth,
    int MissedDaysThisMonth,
    decimal ExpectedThisMonth,
    decimal ReceivedThisMonth,
    decimal PendingThisMonth,
    IReadOnlyList<ProviderCustomerDto> Customers);

public sealed record ProviderMilkCustomerDetailDto(
    Guid HouseholdUserId,
    string HouseholdName,
    string? City,
    MilkSubscriptionDto? Subscription);
