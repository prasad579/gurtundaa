using Microsoft.AspNetCore.Identity;

namespace Gurtundaa.Domain.Entities;

public class AppUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;

    public UserType UserType { get; set; } = UserType.Customer;

    /// <summary>Providers only: the UPI VPA customers pay directly — Gurtundaa never touches the money, just builds the `upi://pay` link and tracks the two-sided confirm.</summary>
    public string? UpiId { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Reminder> Reminders { get; set; } = new List<Reminder>();

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
