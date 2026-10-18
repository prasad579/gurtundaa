using System.ComponentModel.DataAnnotations;
using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Application.ServiceContacts;

public sealed record ServiceContactDto(
    Guid Id,
    ServiceContactCategory Category,
    string Name,
    string Phone,
    string? Address,
    bool IsDefault,
    DateTimeOffset CreatedAt);

public sealed record SaveServiceContactRequest(
    ServiceContactCategory Category,
    [Required, MaxLength(100)] string Name,
    [Required, MaxLength(20)] string Phone,
    [MaxLength(200)] string? Address,
    bool IsDefault = false);
