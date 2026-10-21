using Gurtundaa.Application.Common;
using Gurtundaa.Application.Health;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Health;

public class DoseLogService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IDoseLogService
{
    // Matches the mockup's fixed slot times exactly (8:00 AM / 1:30 PM / 6:00 PM / 9:00 PM).
    private static readonly Dictionary<DoseSlot, TimeOnly> SlotTimes = new()
    {
        [DoseSlot.Morning] = new TimeOnly(8, 0),
        [DoseSlot.Afternoon] = new TimeOnly(13, 30),
        [DoseSlot.Evening] = new TimeOnly(18, 0),
        [DoseSlot.Night] = new TimeOnly(21, 0),
    };

    public async Task<IReadOnlyList<DoseEntryDto>> GetTodayAsync(CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var now = clock.GetUtcNow();
        var today = DateOnly.FromDateTime(now.LocalDateTime);

        var medicines = await db.Medicines.Include(m => m.Member)
            .Where(m => m.UserId == userId && m.IsActive)
            .ToListAsync(ct);

        var logs = await db.DoseLogs
            .Where(l => l.Date == today && l.Medicine!.UserId == userId)
            .ToListAsync(ct);
        var logsByMedicineSlot = logs.ToDictionary(l => (l.MedicineId, l.Slot));

        var entries = new List<DoseEntryDto>();
        var changed = false;

        foreach (var medicine in medicines)
        {
            if (!IsDueOn(medicine, today))
            {
                continue;
            }

            foreach (var slot in Enum.GetValues<DoseSlot>())
            {
                var qty = QtyForSlot(medicine, slot);
                if (qty <= 0)
                {
                    continue;
                }

                logsByMedicineSlot.TryGetValue((medicine.Id, slot), out var log);

                // Self-healing on read (same idea as BillService's recurring-bill roll-forward):
                // a dose left untouched 2h past its slot time is treated as taken, deducting stock,
                // without needing a background job.
                if (log is null && now.LocalDateTime > today.ToDateTime(SlotTimes[slot]).AddHours(2))
                {
                    log = new DoseLog { MedicineId = medicine.Id, Date = today, Slot = slot, Status = DoseStatus.Taken, TakenAt = now };
                    db.DoseLogs.Add(log);
                    medicine.StockCount = Math.Max(0, medicine.StockCount - qty);
                    changed = true;
                }

                entries.Add(ToDto(medicine, slot, qty, log?.Status));
            }
        }

        if (changed)
        {
            await db.SaveChangesAsync(ct);
        }

        return entries
            .OrderBy(e => e.Slot)
            .ThenBy(e => e.MemberName)
            .ThenBy(e => e.MedicineName)
            .ToList();
    }

    public async Task<DoseEntryDto?> SetStatusAsync(Guid medicineId, DateOnly date, DoseSlot slot, SetDoseStatusRequest request, CancellationToken ct)
    {
        var medicine = await db.Medicines.Include(m => m.Member)
            .SingleOrDefaultAsync(m => m.Id == medicineId && m.UserId == currentUser.UserId, ct);
        if (medicine is null)
        {
            return null;
        }

        var qty = QtyForSlot(medicine, slot);
        var log = await db.DoseLogs.SingleOrDefaultAsync(l => l.MedicineId == medicineId && l.Date == date && l.Slot == slot, ct);
        var wasTaken = log?.Status == DoseStatus.Taken;

        if (request.Status is null)
        {
            if (log is not null)
            {
                if (wasTaken) medicine.StockCount += qty;
                db.DoseLogs.Remove(log);
            }
        }
        else
        {
            if (log is null)
            {
                log = new DoseLog { MedicineId = medicineId, Date = date, Slot = slot };
                db.DoseLogs.Add(log);
            }

            var isNowTaken = request.Status == DoseStatus.Taken;
            if (isNowTaken && !wasTaken) medicine.StockCount = Math.Max(0, medicine.StockCount - qty);
            if (!isNowTaken && wasTaken) medicine.StockCount += qty;

            log.Status = request.Status.Value;
            log.TakenAt = isNowTaken ? clock.GetUtcNow() : null;
        }

        await db.SaveChangesAsync(ct);
        return ToDto(medicine, slot, qty, request.Status);
    }

    private static bool IsDueOn(Medicine medicine, DateOnly date)
    {
        if (date < medicine.StartDate)
        {
            return false;
        }

        if (medicine.Mode == MedicineMode.Course && medicine.CourseDays is { } courseDays)
        {
            return date < medicine.StartDate.AddDays(courseDays);
        }

        return true;
    }

    private static int QtyForSlot(Medicine medicine, DoseSlot slot) => slot switch
    {
        DoseSlot.Morning => medicine.MorningQty,
        DoseSlot.Afternoon => medicine.AfternoonQty,
        DoseSlot.Evening => medicine.EveningQty,
        DoseSlot.Night => medicine.NightQty,
        _ => 0,
    };

    private static DoseEntryDto ToDto(Medicine medicine, DoseSlot slot, int qty, DoseStatus? status)
    {
        var perDay = medicine.MorningQty + medicine.AfternoonQty + medicine.EveningQty + medicine.NightQty;
        var daysRemaining = perDay > 0 ? medicine.StockCount / perDay : 0;

        return new DoseEntryDto(
            medicine.Id,
            medicine.Name,
            medicine.MemberId,
            medicine.Member?.Name ?? string.Empty,
            medicine.Member?.AvatarEmoji ?? "🧑",
            slot,
            qty,
            medicine.FoodTiming,
            status,
            medicine.StockCount,
            daysRemaining);
    }
}
