namespace Gurtundaa.Application.Milk;

public interface IMilkDeliveryService
{
    Task<MilkMonthDto> GetMonthAsync(int year, int month, CancellationToken ct);

    /// <summary>Same resolution as <see cref="GetMonthAsync"/> but for an arbitrary household — lets the provider dashboard show/aggregate month data for linked households without duplicating the day-by-day resolution rules.</summary>
    Task<MilkMonthDto> GetMonthForUserAsync(Guid userId, int year, int month, CancellationToken ct);

    Task<MilkTodayDto> GetTodayAsync(CancellationToken ct);

    Task<MilkTodayDto> SetOverrideAsync(DateOnly date, SetMilkDeliveryOverrideRequest request, CancellationToken ct);

    Task<MilkMonthSummaryDto> SetSettlementPaidAsync(int year, int month, SetMilkSettlementPaidRequest request, CancellationToken ct);
}
