using Gurtundaa.Application.Milk;

namespace Gurtundaa.Application.Providers;

public interface IManualMilkService
{
    Task<IReadOnlyList<ManualMilkEntryDto>> ListAsync(Guid providerCustomerId, int take, CancellationToken ct);

    /// <summary>Same calendar shape the household sees — days with a logged entry show "Delivered"; days without one (past or future) show the customer's default quantity as "planned".</summary>
    Task<MilkMonthDto?> GetMonthAsync(Guid providerCustomerId, int year, int month, CancellationToken ct);

    /// <summary>Per-day totals across every manual milk customer, for the dashboard-wide calendar.</summary>
    Task<IReadOnlyList<ManualMilkDaySummaryDto>> GetProviderMonthSummaryAsync(int year, int month, CancellationToken ct);

    /// <summary>Per-customer breakdown for one day — what a tap on the dashboard calendar drills into.</summary>
    Task<IReadOnlyList<ManualMilkDayCustomerDto>> GetDayDetailAsync(DateOnly date, CancellationToken ct);

    /// <summary>One regular-order entry per customer per day — creates or updates that day's entry.</summary>
    Task<ManualMilkEntryDto?> UpsertAsync(Guid providerCustomerId, SaveManualMilkEntryRequest request, CancellationToken ct);

    /// <summary>Logs an ad-hoc "they called asking for more" entry — kept separate from the day's regular order, any number per day.</summary>
    Task<ManualMilkEntryDto?> AddExtraAsync(Guid providerCustomerId, AddManualMilkExtraRequest request, CancellationToken ct);

    /// <summary>Logs milk the shop handed back (unsold/spoiled) — subtracts from their litres/amount totals instead of adding.</summary>
    Task<ManualMilkEntryDto?> AddReturnAsync(Guid providerCustomerId, AddManualMilkReturnRequest request, CancellationToken ct);

    Task<ManualMilkEntryDto?> SetPaidAsync(Guid entryId, SetManualMilkPaidRequest request, CancellationToken ct);

    Task<bool> DeleteAsync(Guid entryId, CancellationToken ct);
}
