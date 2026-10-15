using Gurtundaa.Application.Common;

namespace Gurtundaa.Application.Auth;

public interface IAuthService
{
    Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken ct);

    Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken ct);

    Task<Result<AuthResponse>> RefreshAsync(string refreshToken, CancellationToken ct);

    Task RevokeAsync(string refreshToken, CancellationToken ct);

    Task<UserDto?> GetUserAsync(Guid userId, CancellationToken ct);
}
