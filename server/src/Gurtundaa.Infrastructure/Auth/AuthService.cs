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
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Gurtundaa.Infrastructure.Auth;

public class AuthService(
    UserManager<AppUser> userManager,
    AppDbContext db,
    IOptions<JwtOptions> jwtOptions,
    IOtpSender otpSender,
    IHostEnvironment env,
    TimeProvider clock) : IAuthService
{
    private const int OtpLength = 6;
    private const int OtpValidityMinutes = 5;
    private const int MaxOtpAttempts = 5;

    // Dev convenience: every OTP is this fixed code in Development, so you don't need to check server logs.
    private const string FixedDevCode = "123456";

    private readonly JwtOptions jwt = jwtOptions.Value;

    public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var phoneNumber = NormalizePhone(request.PhoneNumber);
        if (await userManager.Users.AnyAsync(u => u.PhoneNumber == phoneNumber, ct))
        {
            return Result<AuthResponse>.Fail("An account with that mobile number already exists.");
        }

        var user = new AppUser
        {
            Email = request.Email.Trim(),
            UserName = request.Email.Trim(),
            DisplayName = request.DisplayName.Trim(),
            PhoneNumber = phoneNumber,
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

    public async Task<Result<RequestOtpResponse>> RequestPhoneOtpAsync(string phoneNumber, CancellationToken ct)
    {
        var normalized = NormalizePhone(phoneNumber);
        var user = await userManager.Users.SingleOrDefaultAsync(u => u.PhoneNumber == normalized, ct);
        if (user is null)
        {
            return Result<RequestOtpResponse>.Fail("No account found with that mobile number.");
        }

        var code = env.IsDevelopment() ? FixedDevCode : RandomNumberGenerator.GetInt32(0, 1_000_000).ToString($"D{OtpLength}");
        db.PhoneOtps.Add(new PhoneOtp
        {
            PhoneNumber = normalized,
            CodeHash = Hash(code),
            ExpiresAt = clock.GetUtcNow().AddMinutes(OtpValidityMinutes),
        });
        await db.SaveChangesAsync(ct);

        await otpSender.SendAsync(normalized, code, ct);

        // Dev builds echo the code back so you can test without a real SMS provider wired up.
        return Result<RequestOtpResponse>.Ok(new RequestOtpResponse(true, env.IsDevelopment() ? code : null));
    }

    public async Task<Result<AuthResponse>> VerifyPhoneOtpAsync(VerifyOtpRequest request, CancellationToken ct)
    {
        var normalized = NormalizePhone(request.PhoneNumber);
        var now = clock.GetUtcNow();

        var otp = await db.PhoneOtps
            .Where(o => o.PhoneNumber == normalized && o.ConsumedAt == null && o.ExpiresAt > now)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (otp is null)
        {
            return Result<AuthResponse>.Fail("Code expired. Request a new one.");
        }

        if (otp.Attempts >= MaxOtpAttempts)
        {
            return Result<AuthResponse>.Fail("Too many attempts. Request a new code.");
        }

        if (otp.CodeHash != Hash(request.Code))
        {
            otp.Attempts++;
            await db.SaveChangesAsync(ct);
            return Result<AuthResponse>.Fail("Incorrect code.");
        }

        var user = await userManager.Users.SingleOrDefaultAsync(u => u.PhoneNumber == normalized, ct);
        if (user is null)
        {
            return Result<AuthResponse>.Fail("No account found with that mobile number.");
        }

        otp.ConsumedAt = now;
        await db.SaveChangesAsync(ct);

        return Result<AuthResponse>.Ok(await IssueTokensAsync(user, ct));
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

    private static UserDto ToDto(AppUser user) => new(user.Id, user.Email ?? string.Empty, user.DisplayName, user.PhoneNumber);

    private static string Hash(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    private static string NormalizePhone(string phoneNumber) =>
        new([.. phoneNumber.Where(c => char.IsDigit(c) || c == '+')]);
}
