using System.ComponentModel.DataAnnotations;
using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Application.Health;

public sealed record HouseholdMemberDto(Guid Id, string Name, string Relation, string AvatarEmoji);

public sealed record SaveHouseholdMemberRequest(
    [Required, MaxLength(50)] string Name,
    [MaxLength(30)] string Relation,
    [MaxLength(10)] string AvatarEmoji);

public sealed record MedicineDto(
    Guid Id,
    Guid MemberId,
    string MemberName,
    string MemberAvatarEmoji,
    string Name,
    MedicineMode Mode,
    int? CourseDays,
    int MorningQty,
    int AfternoonQty,
    int EveningQty,
    int NightQty,
    FoodTiming FoodTiming,
    int StockCount,
    DateOnly StartDate,
    bool IsActive,
    int PerDayQty,
    int DaysRemaining,
    DateOnly? LastDoseDate,
    DateOnly? RefillReminderDate,
    DateTimeOffset CreatedAt);

public sealed record SaveMedicineRequest(
    Guid MemberId,
    [Required, MaxLength(100)] string Name,
    MedicineMode Mode,
    [Range(1, 365)] int? CourseDays,
    [Range(0, 4)] int MorningQty,
    [Range(0, 4)] int AfternoonQty,
    [Range(0, 4)] int EveningQty,
    [Range(0, 4)] int NightQty,
    FoodTiming FoodTiming,
    [Range(0, 2000)] int StockCount,
    DateOnly StartDate);

public sealed record DoseEntryDto(
    Guid MedicineId,
    string MedicineName,
    Guid MemberId,
    string MemberName,
    string MemberAvatarEmoji,
    DoseSlot Slot,
    int Qty,
    FoodTiming FoodTiming,
    DoseStatus? Status,
    int StockLeft,
    int DaysRemaining);

public sealed record SetDoseStatusRequest(DoseStatus? Status);

public sealed record PrescriptionDto(
    Guid Id,
    Guid MemberId,
    string MemberName,
    string MemberAvatarEmoji,
    string DoctorName,
    string? DoctorSpecialty,
    DateOnly VisitDate,
    DateOnly? RevisitDate,
    IReadOnlyList<MedicineDto> Medicines,
    DateTimeOffset CreatedAt);

public sealed record SavePrescriptionRequest(
    Guid MemberId,
    [Required, MaxLength(100)] string DoctorName,
    [MaxLength(100)] string? DoctorSpecialty,
    DateOnly VisitDate,
    DateOnly? RevisitDate,
    [MinLength(1)] IReadOnlyList<SaveMedicineRequest> Medicines);
