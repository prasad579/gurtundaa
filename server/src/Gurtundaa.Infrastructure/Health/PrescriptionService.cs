using Gurtundaa.Application.Common;
using Gurtundaa.Application.Health;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Health;

public class PrescriptionService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IPrescriptionService
{
    private IQueryable<Prescription> Mine => db.Prescriptions.Where(p => p.UserId == currentUser.UserId);

    public async Task<IReadOnlyList<PrescriptionDto>> ListAsync(CancellationToken ct)
    {
        var prescriptions = await Mine.AsNoTracking()
            .Include(p => p.Member)
            .OrderByDescending(p => p.VisitDate)
            .ToListAsync(ct);

        var ids = prescriptions.Select(p => p.Id).ToList();
        var medicines = await db.Medicines.AsNoTracking()
            .Include(m => m.Member)
            .Where(m => m.PrescriptionId != null && ids.Contains(m.PrescriptionId!.Value))
            .ToListAsync(ct);
        var medicinesByPrescription = medicines.GroupBy(m => m.PrescriptionId!.Value).ToDictionary(g => g.Key, g => g.ToList());

        var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);
        return prescriptions.Select(p => ToDto(p, medicinesByPrescription.GetValueOrDefault(p.Id, []), today)).ToList();
    }

    public async Task<PrescriptionDto> CreateAsync(SavePrescriptionRequest request, CancellationToken ct)
    {
        var memberExists = await db.HouseholdMembers.AnyAsync(m => m.Id == request.MemberId && m.UserId == currentUser.UserId, ct);
        if (!memberExists)
        {
            throw new InvalidOperationException("That household member doesn't exist.");
        }

        var now = clock.GetUtcNow();
        var prescription = new Prescription
        {
            UserId = currentUser.UserId,
            MemberId = request.MemberId,
            DoctorName = request.DoctorName.Trim(),
            DoctorSpecialty = string.IsNullOrWhiteSpace(request.DoctorSpecialty) ? null : request.DoctorSpecialty.Trim(),
            VisitDate = request.VisitDate,
            RevisitDate = request.RevisitDate,
            CreatedAt = now,
        };
        db.Prescriptions.Add(prescription);

        var medicines = new List<Medicine>();
        foreach (var medicineRequest in request.Medicines)
        {
            var medicine = new Medicine { UserId = currentUser.UserId, PrescriptionId = prescription.Id, CreatedAt = now };
            MedicineService.Apply(medicine, medicineRequest with { MemberId = request.MemberId }, now);
            medicines.Add(medicine);
        }
        db.Medicines.AddRange(medicines);

        await db.SaveChangesAsync(ct);

        var member = await db.HouseholdMembers.AsNoTracking().SingleAsync(m => m.Id == request.MemberId, ct);
        foreach (var medicine in medicines)
        {
            medicine.Member = member;
        }

        var today = DateOnly.FromDateTime(now.LocalDateTime);
        prescription.Member = member;
        return ToDto(prescription, medicines, today);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct)
    {
        // A medicine is still independently valid without its prescription (you may keep taking
        // it after the record is removed) — unlink rather than cascade-delete, unlike
        // HouseholdMemberService.DeleteAsync where an orphaned medicine makes no sense at all.
        await db.Medicines
            .Where(m => m.UserId == currentUser.UserId && m.PrescriptionId == id)
            .ExecuteUpdateAsync(m => m.SetProperty(x => x.PrescriptionId, (Guid?)null), ct);

        return await Mine.Where(p => p.Id == id).ExecuteDeleteAsync(ct) > 0;
    }

    private static PrescriptionDto ToDto(Prescription prescription, IReadOnlyList<Medicine> medicines, DateOnly today) => new(
        prescription.Id,
        prescription.MemberId,
        prescription.Member?.Name ?? string.Empty,
        prescription.Member?.AvatarEmoji ?? "🧑",
        prescription.DoctorName,
        prescription.DoctorSpecialty,
        prescription.VisitDate,
        prescription.RevisitDate,
        medicines.Select(m => MedicineService.ToDto(m, today)).ToList(),
        prescription.CreatedAt);
}
