using Gurtundaa.Application.Common;

namespace Gurtundaa.Application.Providers;

public interface ILaundryPickupRequestService
{
    /// <summary>Household side: ask their linked dhobi (resolved from the contact's active provider link) to collect laundry on a date.</summary>
    Task<Result<LaundryPickupRequestDto>> CreateAsync(CreatePickupRequestRequest request, CancellationToken ct);

    /// <summary>Provider side: pending (unhandled) requests from linked households.</summary>
    Task<IReadOnlyList<LaundryPickupRequestDto>> ListPendingForProviderAsync(CancellationToken ct);

    Task<bool> MarkHandledAsync(Guid id, CancellationToken ct);
}
