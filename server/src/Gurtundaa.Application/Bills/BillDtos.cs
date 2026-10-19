using System.ComponentModel.DataAnnotations;
using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Application.Bills;

public sealed record BillDto(
    Guid Id,
    BillCategory Category,
    string Name,
    decimal Amount,
    DateOnly DueDate,
    BillRecurrence Recurrence,
    int ReminderLeadDays,
    bool IsPaid,
    DateTimeOffset? PaidAt,
    string? Notes,
    DateTimeOffset CreatedAt);

public sealed record SaveBillRequest(
    BillCategory Category,
    [Required, MaxLength(100)] string Name,
    [Range(0, 10_000_000)] decimal Amount,
    [Required] DateOnly DueDate,
    BillRecurrence Recurrence,
    [Range(0, 30)] int ReminderLeadDays,
    [MaxLength(200)] string? Notes);

public sealed record SetBillPaidRequest(bool IsPaid);
