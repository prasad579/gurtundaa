using Gurtundaa.Application.Common;
using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Application.Providers;

public interface IProviderLinkService
{
    /// <summary>The household's current (non-revoked) invite/link for this contact, or null if never invited.</summary>
    Task<ProviderLinkDto?> GetForContactAsync(Guid serviceContactId, CancellationToken ct);

    /// <summary>Idempotent: returns the existing active invite/link for this contact if one exists, else creates a new code. Null if the contact doesn't belong to the caller.</summary>
    Task<ProviderLinkDto?> CreateInviteAsync(CreateProviderInviteRequest request, CancellationToken ct);

    Task<bool> RevokeAsync(Guid id, CancellationToken ct);

    Task<Result<ProviderLinkDto>> ClaimAsync(ClaimProviderInviteRequest request, CancellationToken ct);
}
