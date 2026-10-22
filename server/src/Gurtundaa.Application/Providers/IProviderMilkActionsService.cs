using Gurtundaa.Application.Common;
using Gurtundaa.Application.Milk;

namespace Gurtundaa.Application.Providers;

/// <summary>Lets a linked milk provider record changes on a household's behalf (e.g. marking a day not delivered, or logging extra milk the household forgot to request). Every change is tagged with the provider's identity and surfaces in the household's own activity feed/badge.</summary>
public interface IProviderMilkActionsService
{
    Task<Result<MilkTodayDto>> SetDeliveryOverrideAsync(Guid householdUserId, DateOnly date, SetMilkDeliveryOverrideRequest request, CancellationToken ct);

    Task<Result<MilkExtraRequestDto>> AddExtraAsync(Guid householdUserId, SaveMilkExtraRequestRequest request, CancellationToken ct);

    /// <summary>UPI payments from any linked household, awaiting this provider's confirmation that the money actually arrived.</summary>
    Task<IReadOnlyList<PendingMilkPaymentDto>> ListPendingPaymentsAsync(CancellationToken ct);

    /// <summary>Confirms the provider actually received this UPI payment — only then does it count toward the household's PaidSoFar.</summary>
    Task<bool> ConfirmPaymentAsync(Guid paymentId, CancellationToken ct);

    /// <summary>The provider checked and the money never arrived — the household sees this as rejected, not paid.</summary>
    Task<bool> RejectPaymentAsync(Guid paymentId, CancellationToken ct);
}
