namespace Gurtundaa.Application.Common;

/// <summary>Pure helpers for the mobile numbers used as phone-OTP login identifiers.</summary>
public static class PhoneNumberRules
{
    /// <summary>Strips everything except digits and '+', e.g. "+91 98765-43210" → "+919876543210".</summary>
    public static string Normalize(string phoneNumber) =>
        new([.. phoneNumber.Where(c => char.IsDigit(c) || c == '+')]);

    /// <summary>
    /// True for an Indian mobile number: 10 digits starting with 6–9, optionally prefixed
    /// by "+91", "91" or a trunk "0". Spaces, dashes and brackets are ignored.
    /// </summary>
    public static bool IsValidIndianMobile(string? phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
        {
            return false;
        }

        var digits = Normalize(phoneNumber);

        if (digits.StartsWith("+91"))
        {
            digits = digits[3..];
        }
        else if (digits.Length == 12 && digits.StartsWith("91"))
        {
            digits = digits[2..];
        }
        else if (digits.Length == 11 && digits.StartsWith('0'))
        {
            digits = digits[1..];
        }

        return digits.Length == 10
            && digits[0] is >= '6' and <= '9'
            && digits.All(char.IsAsciiDigit);
    }
}
