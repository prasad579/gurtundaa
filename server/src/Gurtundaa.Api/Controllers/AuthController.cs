using Gurtundaa.Application.Auth;
using Gurtundaa.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService auth, ICurrentUser currentUser) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken ct) =>
        ToActionResult(await auth.RegisterAsync(request, ct));

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken ct) =>
        ToActionResult(await auth.LoginAsync(request, ct), StatusCodes.Status401Unauthorized);

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request, CancellationToken ct) =>
        ToActionResult(await auth.RefreshAsync(request.RefreshToken, ct), StatusCodes.Status401Unauthorized);

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequest request, CancellationToken ct)
    {
        await auth.RevokeAsync(request.RefreshToken, ct);
        return NoContent();
    }

    [HttpPost("otp/request")]
    public async Task<ActionResult<RequestOtpResponse>> RequestOtp(RequestOtpRequest request, CancellationToken ct) =>
        ToActionResult(await auth.RequestPhoneOtpAsync(request.PhoneNumber, ct));

    [HttpPost("otp/verify")]
    public async Task<ActionResult<AuthResponse>> VerifyOtp(VerifyOtpRequest request, CancellationToken ct) =>
        ToActionResult(await auth.VerifyPhoneOtpAsync(request, ct), StatusCodes.Status401Unauthorized);

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct) =>
        await auth.GetUserAsync(currentUser.UserId, ct) is { } user ? Ok(user) : Unauthorized();

    private ActionResult<T> ToActionResult<T>(
        Result<T> result,
        int failureStatus = StatusCodes.Status400BadRequest) =>
        result.Succeeded
            ? Ok(result.Value)
            : Problem(title: string.Join(" ", result.Errors), statusCode: failureStatus);
}
