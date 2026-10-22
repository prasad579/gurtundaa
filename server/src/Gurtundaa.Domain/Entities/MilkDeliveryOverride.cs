namespace Gurtundaa.Domain.Entities;

public class MilkDeliveryOverride
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    public DateOnly Date { get; set; }

    public MilkSlot Slot { get; set; }

    public MilkDeliveryStatus Status { get; set; }

    public decimal? QuantityLtr { get; set; }

    public string? Note { get; set; }

    /// <summary>Set when a linked provider (not the household) made this change — e.g. the milkman marking a day as not delivered.</summary>
    public Guid? AddedByProviderId { get; set; }

    public AppUser? AddedByProvider { get; set; }

    /// <summary>Null until the household has seen this change in their activity feed — drives the "new from your provider" badge.</summary>
    public DateTimeOffset? SeenByHouseholdAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum MilkDeliveryStatus
{
    Delivered = 0,
    Missed = 1,
}

public enum MilkSlot
{
    Morning = 0,
    Evening = 1,
}
