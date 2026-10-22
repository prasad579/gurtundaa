using Gurtundaa.Application.Milk;

namespace Gurtundaa.Application.Providers;

public interface IProviderDashboardService
{
    Task<ProviderLaundryDashboardDto> GetLaundryDashboardAsync(CancellationToken ct);

    Task<ProviderLaundryCustomerDetailDto?> GetLaundryCustomerAsync(Guid householdUserId, CancellationToken ct);

    Task<ProviderMilkDashboardDto> GetMilkDashboardAsync(CancellationToken ct);

    Task<ProviderMilkCustomerDetailDto?> GetMilkCustomerAsync(Guid householdUserId, CancellationToken ct);

    /// <summary>Null if this household isn't linked to the calling provider.</summary>
    Task<MilkMonthDto?> GetMilkCustomerMonthAsync(Guid householdUserId, int year, int month, CancellationToken ct);
}
