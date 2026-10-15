using System.ComponentModel.DataAnnotations;

namespace Gurtundaa.Application.Auth;

public sealed record RegisterRequest(
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required, MinLength(8), MaxLength(128)] string Password,
    [Required, MaxLength(100)] string DisplayName);

public sealed record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public sealed record RefreshRequest([Required] string RefreshToken);

public sealed record AuthResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken,
    UserDto User);

public sealed record UserDto(Guid Id, string Email, string DisplayName);
