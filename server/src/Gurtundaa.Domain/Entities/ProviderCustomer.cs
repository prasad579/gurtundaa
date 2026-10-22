namespace Gurtundaa.Domain.Entities;

/// <summary>
/// A customer a provider (milkman/dhobi) manages directly themselves — a shop, hotel, or anyone
/// who isn't (or isn't yet) a registered household account. Distinct from <see cref="ProviderLink"/>,
/// which links an existing household's own contact card. If this customer later signs up for the
/// app, entering <see cref="LinkCode"/> sets <see cref="ClaimedByUserId"/> so the provider can see
/// it's the same person going forward — their manual ledger here stays as-is either way.
/// </summary>
public class ProviderCustomer
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProviderUserId { get; set; }

    public AppUser? ProviderUser { get; set; }

    public ServiceContactCategory Category { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Phone { get; set; }

    public string? Address { get; set; }

    public string? Notes { get; set; }

    /// <summary>Milk providers only: the usual daily order, used as the "planned" quantity for any day that hasn't been explicitly logged yet, and to prefill the log-order form so most days need zero typing. Covers one variety/slot — shops ordering more than one variety log the others explicitly each day.</summary>
    public decimal? DefaultQuantityLtr { get; set; }

    public decimal? DefaultRatePerLtr { get; set; }

    public MilkSlot DefaultSlot { get; set; } = MilkSlot.Morning;

    public string? DefaultVariety { get; set; }

    public string? LinkCode { get; set; }

    public Guid? ClaimedByUserId { get; set; }

    public AppUser? ClaimedByUser { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? ArchivedAt { get; set; }
}
