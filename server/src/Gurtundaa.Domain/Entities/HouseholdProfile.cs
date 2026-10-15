namespace Gurtundaa.Domain.Entities;

public class HouseholdProfile
{
    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    public string AccountType { get; set; } = "Family";

    public int Adults { get; set; }

    public int Children { get; set; }

    public string? City { get; set; }

    // Comma-separated feature keys, e.g. "bills,medicines,documents".
    public string EnabledFeatures { get; set; } = string.Empty;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
