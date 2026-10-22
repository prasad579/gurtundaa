namespace Gurtundaa.Application.Milk;

public interface IMilkPaymentService
{
    Task<IReadOnlyList<MilkPaymentDto>> ListForMonthAsync(int year, int month, CancellationToken ct);

    /// <summary>Records a self-declared (e.g. cash) payment — counts immediately, same as before UPI existed.</summary>
    Task<MilkPaymentDto> CreateAsync(SaveMilkPaymentRequest request, CancellationToken ct);

    Task<bool> DeleteAsync(Guid id, CancellationToken ct);

    /// <summary>What the household needs to pay their linked provider via UPI — null fields if not linked, not claimed, or the provider hasn't set a UPI ID yet.</summary>
    Task<MilkProviderPaymentInfoDto> GetProviderPaymentInfoAsync(CancellationToken ct);

    /// <summary>Household declares they completed a UPI payment outside the app — stays AwaitingConfirmation (doesn't count toward PaidSoFar) until the provider confirms receiving it.</summary>
    Task<MilkPaymentDto> InitiateUpiAsync(InitiateUpiPaymentRequest request, CancellationToken ct);
}
