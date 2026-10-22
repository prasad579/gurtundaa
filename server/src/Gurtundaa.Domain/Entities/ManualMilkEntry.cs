namespace Gurtundaa.Domain.Entities;

/// <summary>A single day's milk delivery logged by a provider against one of their manual (off-app) customers.</summary>
public class ManualMilkEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProviderCustomerId { get; set; }

    public ProviderCustomer? ProviderCustomer { get; set; }

    public DateOnly Date { get; set; }

    public MilkSlot Slot { get; set; } = MilkSlot.Morning;

    /// <summary>Free-text milk type/grade (e.g. "Regular", "Gold", "Buffalo") — shops often order more than one per day, each tracked as its own line.</summary>
    public string? Variety { get; set; }

    public decimal QuantityLtr { get; set; }

    public decimal RatePerLtr { get; set; }

    public ManualMilkEntryKind Kind { get; set; } = ManualMilkEntryKind.Regular;

    public string? Note { get; set; }

    public bool IsPaid { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum ManualMilkEntryKind
{
    /// <summary>The day's normal order for this slot/variety — one upserted row per (date, slot, variety).</summary>
    Regular = 0,

    /// <summary>An ad-hoc "they called asking for more" log, kept separate from the regular order.</summary>
    Extra = 1,

    /// <summary>Milk the shop handed back (unsold/spoiled) — its quantity/amount subtracts from totals instead of adding.</summary>
    Return = 2,
}
