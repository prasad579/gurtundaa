using Gurtundaa.Application.Common;
using Gurtundaa.Application.Health;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Health;

public class MedicineService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IMedicineService
{
    private IQueryable<Medicine> Mine => db.Medicines.Where(m => m.UserId == currentUser.UserId);

    public async Task<IReadOnlyList<MedicineDto>> ListAsync(CancellationToken ct)
    {
        var medicines = await Mine.AsNoTracking().Include(m => m.Member).OrderBy(m => m.CreatedAt).ToListAsync(ct);
        var today = Today();
        return medicines.Select(m => ToDto(m, today)).ToList();
    }

    public async Task<MedicineDto> CreateAsync(SaveMedicineRequest request, CancellationToken ct)
    {
        await EnsureMemberIsMine(request.MemberId, ct);

        var now = clock.GetUtcNow();
        var medicine = new Medicine { UserId = currentUser.UserId, CreatedAt = now };
        Apply(medicine, request, now);

        db.Medicines.Add(medicine);
        await db.SaveChangesAsync(ct);
        return await ToDtoWithMemberAsync(medicine, ct);
    }

    public async Task<MedicineDto?> UpdateAsync(Guid id, SaveMedicineRequest request, CancellationToken ct)
    {
        var medicine = await Mine.SingleOrDefaultAsync(m => m.Id == id, ct);
        if (medicine is null)
        {
            return null;
        }

        await EnsureMemberIsMine(request.MemberId, ct);
        Apply(medicine, request, clock.GetUtcNow());
        await db.SaveChangesAsync(ct);
        return await ToDtoWithMemberAsync(medicine, ct);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct) =>
        await Mine.Where(m => m.Id == id).ExecuteDeleteAsync(ct) > 0;

    private async Task EnsureMemberIsMine(Guid memberId, CancellationToken ct)
    {
        var exists = await db.HouseholdMembers.AnyAsync(m => m.Id == memberId && m.UserId == currentUser.UserId, ct);
        if (!exists)
        {
            throw new InvalidOperationException("That household member doesn't exist.");
        }
    }

    private async Task<MedicineDto> ToDtoWithMemberAsync(Medicine medicine, CancellationToken ct)
    {
        var member = await db.HouseholdMembers.AsNoTracking().SingleAsync(m => m.Id == medicine.MemberId, ct);
        medicine.Member = member;
        return ToDto(medicine, Today());
    }

    private DateOnly Today() => DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);

    // internal, not private: PrescriptionService reuses this exact mapping when creating medicines
    // as part of a new prescription, so the two never drift apart.
    internal static void Apply(Medicine medicine, SaveMedicineRequest request, DateTimeOffset now)
    {
        medicine.MemberId = request.MemberId;
        medicine.Name = request.Name.Trim();
        medicine.Purpose = string.IsNullOrWhiteSpace(request.Purpose) ? null : request.Purpose.Trim();
        medicine.Mode = request.Mode;
        medicine.CourseDays = request.Mode == MedicineMode.Course ? request.CourseDays : null;
        medicine.MorningQty = request.MorningQty;
        medicine.AfternoonQty = request.AfternoonQty;
        medicine.EveningQty = request.EveningQty;
        medicine.NightQty = request.NightQty;
        medicine.FoodTiming = request.FoodTiming;
        medicine.StockCount = request.StockCount;
        medicine.StartDate = request.StartDate;
        medicine.NextVisitDate = request.NextVisitDate;
        medicine.UpdatedAt = now;
    }

    /// <summary>
    /// Ports the mockup's `plan()` JS verbatim: given current stock and a daily dose total,
    /// `days` is how long the stock lasts, `last` is the final dose date, and `remind` is the date
    /// exactly 2 days' worth of stock will remain (the refill-reminder trigger).
    /// </summary>
    internal static (int Days, DateOnly? Last, DateOnly? Remind) Plan(int stock, int perDay, DateOnly start)
    {
        if (perDay <= 0)
        {
            return (0, null, null);
        }

        var days = stock / perDay;
        var last = days > 0 ? start.AddDays(days - 1) : (DateOnly?)null;
        var k = Math.Max(0, (int)Math.Ceiling((stock - 2m * perDay) / perDay));
        var remind = start.AddDays(k);
        return (days, last, remind);
    }

    internal static MedicineDto ToDto(Medicine medicine, DateOnly today)
    {
        var perDay = medicine.MorningQty + medicine.AfternoonQty + medicine.EveningQty + medicine.NightQty;
        var referenceDate = medicine.StartDate > today ? medicine.StartDate : today;
        var (days, last, remind) = Plan(medicine.StockCount, perDay, referenceDate);

        return new MedicineDto(
            medicine.Id,
            medicine.MemberId,
            medicine.Member?.Name ?? string.Empty,
            medicine.Member?.AvatarEmoji ?? "🧑",
            medicine.Name,
            medicine.Purpose,
            medicine.Mode,
            medicine.CourseDays,
            medicine.MorningQty,
            medicine.AfternoonQty,
            medicine.EveningQty,
            medicine.NightQty,
            medicine.FoodTiming,
            medicine.StockCount,
            medicine.StartDate,
            medicine.NextVisitDate,
            medicine.IsActive,
            perDay,
            days,
            last,
            remind,
            medicine.CreatedAt);
    }
}
