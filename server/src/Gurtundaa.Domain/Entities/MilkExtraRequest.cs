namespace Gurtundaa.Domain.Entities;

public class MilkExtraRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    public DateOnly Date { get; set; }

    public MilkSlot Slot { get; set; } = MilkSlot.Morning;

    public decimal QuantityLtr { get; set; }

    public string? Reason { get; set; }

    /// <summary>Set when a linked provider (not the household) added this — e.g. the milkman logging extra milk the household forgot to request.</summary>
    public Guid? AddedByProviderId { get; set; }

    public AppUser? AddedByProvider { get; set; }

    /// <summary>Null until the household has seen this entry in their activity feed — drives the "new from your provider" badge.</summary>
    public DateTimeOffset? SeenByHouseholdAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
