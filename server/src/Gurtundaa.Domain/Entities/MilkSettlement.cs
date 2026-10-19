namespace Gurtundaa.Domain.Entities;

/// <summary>
/// Tracks only the paid/pending flag for a user's monthly milk bill — the amount itself is always
/// computed live from delivery records + rate (same derived-state approach as the rest of Milk),
/// so this never needs to be kept in sync with changes to past deliveries.
/// </summary>
public class MilkSettlement
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    public int Year { get; set; }

    public int Month { get; set; }

    public bool IsPaid { get; set; }

    public DateTimeOffset? PaidAt { get; set; }
}
