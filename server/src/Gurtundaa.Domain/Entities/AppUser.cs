using Microsoft.AspNetCore.Identity;

namespace Gurtundaa.Domain.Entities;

public class AppUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Reminder> Reminders { get; set; } = new List<Reminder>();

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
