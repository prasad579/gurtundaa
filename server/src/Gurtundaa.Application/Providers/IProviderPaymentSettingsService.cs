namespace Gurtundaa.Application.Providers;

public sealed record ProviderPaymentSettingsDto(string? UpiId);

public sealed record SaveProviderPaymentSettingsRequest(string? UpiId);

/// <summary>A provider's own UPI VPA — account-level, shared across every household/manual customer they serve. Gurtundaa never touches the money; this just lets the app build a `upi://pay` link to them.</summary>
public interface IProviderPaymentSettingsService
{
    Task<ProviderPaymentSettingsDto> GetAsync(CancellationToken ct);

    Task<ProviderPaymentSettingsDto> SaveAsync(SaveProviderPaymentSettingsRequest request, CancellationToken ct);
}
