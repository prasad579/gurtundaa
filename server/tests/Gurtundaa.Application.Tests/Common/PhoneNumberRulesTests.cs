using Gurtundaa.Application.Common;

namespace Gurtundaa.Application.Tests.Common;

public class PhoneNumberRulesTests
{
    [Theory]
    [InlineData("+91 98765-43210", "+919876543210")]
    [InlineData("(987) 654 3210", "9876543210")]
    [InlineData("9876543210", "9876543210")]
    [InlineData("", "")]
    public void Normalize_keeps_only_digits_and_plus(string input, string expected) =>
        Assert.Equal(expected, PhoneNumberRules.Normalize(input));

    [Theory]
    [InlineData("9876543210")]
    [InlineData("6000000000")]
    [InlineData("+919876543210")]
    [InlineData("+91 98765 43210")]
    [InlineData("919876543210")]
    [InlineData("09876543210")]
    [InlineData("98765-43210")]
    public void IsValidIndianMobile_accepts_valid_numbers(string input) =>
        Assert.True(PhoneNumberRules.IsValidIndianMobile(input));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("5876543210")]     // mobiles start with 6-9
    [InlineData("987654321")]      // 9 digits
    [InlineData("98765432101")]    // 11 digits, no trunk 0
    [InlineData("+14155552671")]   // non-Indian country code
    [InlineData("+91987654321")]   // +91 with only 9 digits
    [InlineData("98+76543210")]    // stray plus in the middle
    [InlineData("abcdefghij")]
    public void IsValidIndianMobile_rejects_invalid_numbers(string? input) =>
        Assert.False(PhoneNumberRules.IsValidIndianMobile(input));
}
