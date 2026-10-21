namespace Gurtundaa.Domain.Entities;

public class HouseholdMember
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Relation { get; set; } = string.Empty;

    public string AvatarEmoji { get; set; } = "🧑";

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
