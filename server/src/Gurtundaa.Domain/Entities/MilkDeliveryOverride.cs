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
