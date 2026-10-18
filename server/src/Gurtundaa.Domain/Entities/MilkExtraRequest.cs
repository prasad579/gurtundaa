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

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
