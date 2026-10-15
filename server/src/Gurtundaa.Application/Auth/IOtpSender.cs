namespace Gurtundaa.Application.Auth;

/// <summary>
/// Delivers an OTP code to a phone number. Swap the registered implementation
/// for a real provider (Twilio, SNS, etc.) without touching <see cref="IAuthService"/>.
/// </summary>
public interface IOtpSender
{
    Task SendAsync(string phoneNumber, string code, CancellationToken ct);
}
