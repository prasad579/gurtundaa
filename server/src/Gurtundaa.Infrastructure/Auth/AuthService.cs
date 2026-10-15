using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Gurtundaa.Application.Auth;
using Gurtundaa.Application.Common;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Gurtundaa.Infrastructure.Auth;

public class AuthService(
    UserManager<AppUser> userManager,
    AppDbContext db,
    IOptions<JwtOptions> jwtOptions,
    TimeProvider clock) : IAuthService
{
    private readonly JwtOptions jwt = jwtOptions.Value;

    public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var user = new AppUser
        {
            Email = request.Email.Trim(),
            UserName = request.Email.Trim(),
            DisplayName = request.DisplayName.Trim(),
        };

        var created = await userManager.CreateAsync(user, request.Password);
        if (!created.Succeeded)
        {
            return Result<AuthResponse>.Fail(created.Errors.Select(e => e.Description).ToArray());
        }

        return Result<AuthResponse>.Ok(await IssueTokensAsync(user, ct));
    }

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null || await userManager.IsLockedOutAsync(user))
        {
            return Result<AuthResponse>.Fail("Invalid email or password.");
        }

        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            await userManager.AccessFailedAsync(user);
            return Result<AuthResponse>.Fail("Invalid email or password.");
        }

        await userManager.ResetAccessFailedCountAsync(user);
        return Result<AuthResponse>.Ok(await IssueTokensAsync(user, ct));
    }

    public async Task<Result<AuthResponse>> RefreshAsync(string refreshToken, CancellationToken ct)
    {
        var hash = Hash(refreshToken);
        var stored = await db.RefreshTokens.Include(t => t.User)
            .SingleOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (stored?.User is null || stored.RevokedAt is not null || stored.ExpiresAt <= clock.GetUtcNow())
        {
            return Result<AuthResponse>.Fail("Session expired. Please sign in again.");
        }

        // Rotate: each refresh token is single-use.
        stored.RevokedAt = clock.GetUtcNow();
        return Result<AuthResponse>.Ok(await IssueTokensAsync(stored.User, ct));
    }

    public async Task RevokeAsync(string refreshToken, CancellationToken ct)
    {
        var hash = Hash(refreshToken);
        var stored = await db.RefreshTokens.SingleOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (stored is { RevokedAt: null })
        {
            stored.RevokedAt = clock.GetUtcNow();
            await db.SaveChangesAsync(ct);
        }
    }

    public async Task<UserDto?> GetUserAsync(Guid userId, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Id == userId, ct);
        return user is null ? null : ToDto(user);
    }

    private async Task<AuthResponse> IssueTokensAsync(AppUser user, CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var accessExpires = now.AddMinutes(jwt.AccessTokenMinutes);

        var token = new JwtSecurityToken(
            issuer: jwt.Issuer,
            audience: jwt.Audience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim("name", user.DisplayName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            ],
            notBefore: now.UtcDateTime,
            expires: accessExpires.UtcDateTime,
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
                SecurityAlgorithms.HmacSha256));

        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = Hash(refreshToken),
            CreatedAt = now,
            ExpiresAt = now.AddDays(jwt.RefreshTokenDays),
        });
        await db.SaveChangesAsync(ct);

        return new AuthResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            accessExpires,
            refreshToken,
            ToDto(user));
    }

    private static UserDto ToDto(AppUser user) => new(user.Id, user.Email ?? string.Empty, user.DisplayName);

    private static string Hash(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}
