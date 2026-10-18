namespace Gurtundaa.Domain.Entities;

public class ServiceContact
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    public ServiceContactCategory Category { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string? Address { get; set; }

    public bool IsDefault { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum ServiceContactCategory
{
    Milk = 0,
    Laundry = 1,
    Electrician = 2,
    Plumber = 3,
    Family = 4,
    Other = 5,
}
