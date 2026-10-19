using Gurtundaa.Application.Bills;
using Gurtundaa.Application.Common;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Bills;

public class BillService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IBillService
{
    private IQueryable<Bill> Mine => db.Bills.Where(b => b.UserId == currentUser.UserId);

    public async Task<IReadOnlyList<BillDto>> ListAsync(CancellationToken ct)
    {
        var bills = await Mine.OrderBy(b => b.DueDate).ToListAsync(ct);
        var advanced = false;
        var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);

        // Self-healing on read: a fixed-amount recurring bill (Netflix, rent, insurance) that was
        // marked paid rolls forward to its next cycle the moment that cycle's due date arrives —
        // no re-entry ever needed for bills whose amount never changes.
        foreach (var bill in bills)
        {
            while (bill.IsPaid && bill.Recurrence != BillRecurrence.OneTime && bill.DueDate < today)
            {
                bill.DueDate = NextDueDate(bill.DueDate, bill.Recurrence);
                bill.IsPaid = false;
                bill.PaidAt = null;
                advanced = true;
            }
        }

        if (advanced)
        {
            await db.SaveChangesAsync(ct);
            bills = bills.OrderBy(b => b.DueDate).ToList();
        }

        return bills.Select(ToDto).ToList();
    }

    public async Task<BillDto> CreateAsync(SaveBillRequest request, CancellationToken ct)
    {
        var bill = new Bill { UserId = currentUser.UserId, CreatedAt = clock.GetUtcNow() };
        Apply(bill, request, clock.GetUtcNow());

        db.Bills.Add(bill);
        await db.SaveChangesAsync(ct);
        return ToDto(bill);
    }

    public async Task<BillDto?> UpdateAsync(Guid id, SaveBillRequest request, CancellationToken ct)
    {
        var bill = await Mine.SingleOrDefaultAsync(b => b.Id == id, ct);
        if (bill is null)
        {
            return null;
        }

        Apply(bill, request, clock.GetUtcNow());
        await db.SaveChangesAsync(ct);
        return ToDto(bill);
    }

    public async Task<BillDto?> SetPaidAsync(Guid id, SetBillPaidRequest request, CancellationToken ct)
    {
        var bill = await Mine.SingleOrDefaultAsync(b => b.Id == id, ct);
        if (bill is null)
        {
            return null;
        }

        bill.IsPaid = request.IsPaid;
        bill.PaidAt = request.IsPaid ? clock.GetUtcNow() : null;
        bill.UpdatedAt = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);
        return ToDto(bill);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct) =>
        await Mine.Where(b => b.Id == id).ExecuteDeleteAsync(ct) > 0;

    private static DateOnly NextDueDate(DateOnly current, BillRecurrence recurrence) => recurrence switch
    {
        BillRecurrence.Monthly => current.AddMonths(1),
        BillRecurrence.Quarterly => current.AddMonths(3),
        BillRecurrence.Yearly => current.AddYears(1),
        _ => current,
    };

    private static void Apply(Bill bill, SaveBillRequest request, DateTimeOffset now)
    {
        bill.Category = request.Category;
        bill.Name = request.Name.Trim();
        bill.Amount = request.Amount;
        bill.DueDate = request.DueDate;
        bill.Recurrence = request.Recurrence;
        bill.ReminderLeadDays = request.ReminderLeadDays;
        bill.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        bill.UpdatedAt = now;
    }

    private static BillDto ToDto(Bill bill) => new(
        bill.Id,
        bill.Category,
        bill.Name,
        bill.Amount,
        bill.DueDate,
        bill.Recurrence,
        bill.ReminderLeadDays,
        bill.IsPaid,
        bill.PaidAt,
        bill.Notes,
        bill.CreatedAt);
}
