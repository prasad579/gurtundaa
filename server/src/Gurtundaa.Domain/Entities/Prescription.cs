namespace Gurtundaa.Domain.Entities;

public class Prescription
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    public Guid MemberId { get; set; }

    public HouseholdMember? Member { get; set; }

    public string DoctorName { get; set; } = string.Empty;

    public string? DoctorSpecialty { get; set; }

    public DateOnly VisitDate { get; set; }

    public DateOnly? RevisitDate { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
