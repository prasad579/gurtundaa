using System.ComponentModel.DataAnnotations;

namespace Gurtundaa.Application.Household;

public sealed record HouseholdProfileDto(
    string AccountType,
    int Adults,
    int Children,
    string? City,
    IReadOnlyList<string> EnabledFeatures);

public sealed record SaveHouseholdProfileRequest(
    [Required, MaxLength(30)] string AccountType,
    [Range(0, 20)] int Adults,
    [Range(0, 20)] int Children,
    [MaxLength(100)] string? City,
    IReadOnlyList<string> EnabledFeatures);
