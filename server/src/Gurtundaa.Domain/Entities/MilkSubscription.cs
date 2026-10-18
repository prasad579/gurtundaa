namespace Gurtundaa.Domain.Entities;

public class MilkSubscription
{
    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    public Guid? ContactId { get; set; }

    public ServiceContact? Contact { get; set; }

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
