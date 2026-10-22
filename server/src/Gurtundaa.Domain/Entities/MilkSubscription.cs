namespace Gurtundaa.Domain.Entities;

public class MilkSubscription
{
    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    public Guid? ContactId { get; set; }

    public ServiceContact? Contact { get; set; }

    /// <summary>True when the household buys/collects milk themselves (no delivery person) — skips the contact requirement and only changes wording on the client; billing/tracking is identical either way.</summary>
    public bool IsSelfCollected { get; set; }

    /// <summary>
    /// The first day delivery is actually tracked from. Days before this are excluded from the
    /// calendar, summary counts, and billed amount entirely — they're neither "delivered" nor
    /// "missed", they simply predate the household's use of the app (or the subscription itself).
    /// </summary>
    public DateOnly StartDate { get; set; }

    public bool MorningEnabled { get; set; } = true;

    public decimal MorningQuantityLtr { get; set; }

    public TimeOnly? MorningWindowStart { get; set; }

    public TimeOnly? MorningWindowEnd { get; set; }

    public bool EveningEnabled { get; set; }

    public decimal EveningQuantityLtr { get; set; }

    public TimeOnly? EveningWindowStart { get; set; }

    public TimeOnly? EveningWindowEnd { get; set; }

    public decimal RatePerLtr { get; set; }

    public MilkSettlementCycle SettlementCycle { get; set; } = MilkSettlementCycle.Monthly;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum MilkSettlementCycle
{
    Monthly = 0,
}
