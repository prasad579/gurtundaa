using System.ComponentModel.DataAnnotations;
using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Application.Auth;

public sealed record RegisterRequest(
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required, MinLength(8), MaxLength(128)] string Password,
    [Required, MaxLength(100)] string DisplayName,
    [Required, MaxLength(20)] string PhoneNumber,
    UserType UserType = UserType.Customer);

public sealed record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public sealed record RefreshRequest([Required] string RefreshToken);

public sealed record RequestOtpRequest([Required, MaxLength(20)] string PhoneNumber);

public sealed record RequestOtpResponse(bool Sent, string? DevCode);

public sealed record VerifyOtpRequest(
    [Required, MaxLength(20)] string PhoneNumber,
    [Required, MinLength(4), MaxLength(8)] string Code);

public sealed record AuthResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken,
    UserDto User);

public sealed record UserDto(Guid Id, string Email, string DisplayName, string? PhoneNumber, UserType UserType);
