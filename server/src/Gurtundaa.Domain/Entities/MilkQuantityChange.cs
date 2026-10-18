namespace Gurtundaa.Domain.Entities;

public class MilkQuantityChange
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public decimal MorningQuantityLtr { get; set; }

    public decimal EveningQuantityLtr { get; set; }

    public string? Reason { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
