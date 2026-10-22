namespace Gurtundaa.Domain.Entities;

/// <summary>
/// Links a household's <see cref="ServiceContact"/> (their milkman/dhobi) to that provider's own
/// account, via a one-time invite code the household shares out-of-band (WhatsApp/SMS). Unclaimed
/// rows have <see cref="ProviderUserId"/> null; once a provider enters the code, this row becomes
/// the household's entry in that provider's read-only customer list.
/// </summary>
public class ProviderLink
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid HouseholdUserId { get; set; }

    public AppUser? HouseholdUser { get; set; }

    public Guid ServiceContactId { get; set; }

    public ServiceContact? ServiceContact { get; set; }

    public ServiceContactCategory Category { get; set; }

    public string InviteCode { get; set; } = string.Empty;

    public Guid? ProviderUserId { get; set; }

    public AppUser? ProviderUser { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? ClaimedAt { get; set; }

    public DateTimeOffset? RevokedAt { get; set; }
}
