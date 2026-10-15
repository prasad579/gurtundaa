using Gurtundaa.Application.Auth;
using Microsoft.Extensions.Logging;

namespace Gurtundaa.Infrastructure.Auth;

/// <summary>
/// Dev-mode stand-in for a real SMS provider: logs the code instead of sending a text.
/// Replace with a Twilio/SNS-backed <see cref="IOtpSender"/> before shipping to real users.
/// </summary>
public class ConsoleOtpSender(ILogger<ConsoleOtpSender> logger) : IOtpSender
{
    public Task SendAsync(string phoneNumber, string code, CancellationToken ct)
    {
        logger.LogInformation("OTP for {PhoneNumber}: {Code}", phoneNumber, code);
        return Task.CompletedTask;
    }
}
