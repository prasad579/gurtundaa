using Gurtundaa.Application.Common;

namespace Gurtundaa.Application.Providers;

/// <summary>Manages a provider's own manual (off-app) customers — shops, hotels, anyone who isn't a registered household. Category is implied by the calling provider's own account type.</summary>
public interface IProviderCustomersService
{
    Task<IReadOnlyList<ProviderManualCustomerDto>> ListAsync(CancellationToken ct);

    Task<ProviderManualCustomerDto> CreateAsync(SaveProviderManualCustomerRequest request, CancellationToken ct);

    Task<ProviderManualCustomerDto?> UpdateAsync(Guid id, SaveProviderManualCustomerRequest request, CancellationToken ct);

    Task<bool> ArchiveAsync(Guid id, CancellationToken ct);

    /// <summary>Idempotent: returns the existing code if one was already generated.</summary>
    Task<ProviderManualCustomerDto?> GenerateLinkCodeAsync(Guid id, CancellationToken ct);

    /// <summary>Called by a real (Customer) account entering a provider-shared code — ties the manual record to them without touching their own data.</summary>
    Task<Result<ProviderManualCustomerDto>> ClaimAsync(ClaimProviderCustomerRequest request, CancellationToken ct);
}
