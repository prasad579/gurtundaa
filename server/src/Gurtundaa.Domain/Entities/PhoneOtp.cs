namespace Gurtundaa.Domain.Entities;

public class PhoneOtp
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string PhoneNumber { get; set; } = string.Empty;

    // Only a SHA-256 hash is stored, so a leaked database can't be used to replay a code.
    public string CodeHash { get; set; } = string.Empty;

    public int Attempts { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? ConsumedAt { get; set; }
}
