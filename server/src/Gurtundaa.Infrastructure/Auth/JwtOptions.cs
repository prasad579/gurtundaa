namespace Gurtundaa.Infrastructure.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "gurtundaa";

    public string Audience { get; set; } = "gurtundaa-clients";

    // Never committed: set via `dotnet user-secrets` locally and an env var / key vault elsewhere.
    public string SigningKey { get; set; } = string.Empty;

    public int AccessTokenMinutes { get; set; } = 15;

    public int RefreshTokenDays { get; set; } = 30;
}
