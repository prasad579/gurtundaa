using Gurtundaa.Application.Common;
using Gurtundaa.Application.Milk;
using Gurtundaa.Application.Providers;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Providers;

public class ManualMilkService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IManualMilkService
{
    public async Task<IReadOnlyList<ManualMilkEntryDto>> ListAsync(Guid providerCustomerId, int take, CancellationToken ct)
    {
        if (!await OwnsCustomerAsync(providerCustomerId, ct))
        {
            return [];
        }

        return await db.ManualMilkEntries.AsNoTracking()
            .Where(e => e.ProviderCustomerId == providerCustomerId)
            .OrderByDescending(e => e.Date).ThenByDescending(e => e.CreatedAt)
            .Take(take)
            .Select(e => ToDto(e))
            .ToListAsync(ct);
    }

    public async Task<ManualMilkEntryDto?> UpsertAsync(Guid providerCustomerId, SaveManualMilkEntryRequest request, CancellationToken ct)
    {
        if (!await OwnsCustomerAsync(providerCustomerId, ct))
        {
            return null;
        }

        var variety = NormalizeVariety(request.Variety);
        var entry = await db.ManualMilkEntries
            .SingleOrDefaultAsync(e => e.ProviderCustomerId == providerCustomerId && e.Date == request.Date && e.Slot == request.Slot
                && e.Variety == variety && e.Kind == ManualMilkEntryKind.Regular, ct);
        if (entry is null)
        {
            entry = new ManualMilkEntry { ProviderCustomerId = providerCustomerId, Date = request.Date, Slot = request.Slot, Variety = variety, CreatedAt = clock.GetUtcNow() };
            db.ManualMilkEntries.Add(entry);
        }

        entry.QuantityLtr = request.QuantityLtr;
        entry.RatePerLtr = request.RatePerLtr;
        entry.IsPaid = request.IsPaid;

        await db.SaveChangesAsync(ct);
        return ToDto(entry);
    }

    public Task<ManualMilkEntryDto?> AddExtraAsync(Guid providerCustomerId, AddManualMilkExtraRequest request, CancellationToken ct) =>
        AddLedgerEntryAsync(providerCustomerId, request.Date, request.Slot, request.Variety, request.QuantityLtr, request.RatePerLtr, request.Note, ManualMilkEntryKind.Extra, ct);

    public Task<ManualMilkEntryDto?> AddReturnAsync(Guid providerCustomerId, AddManualMilkReturnRequest request, CancellationToken ct) =>
        AddLedgerEntryAsync(providerCustomerId, request.Date, request.Slot, request.Variety, request.QuantityLtr, request.RatePerLtr, request.Note, ManualMilkEntryKind.Return, ct);

    private async Task<ManualMilkEntryDto?> AddLedgerEntryAsync(
        Guid providerCustomerId, DateOnly date, MilkSlot slot, string? variety, decimal quantityLtr, decimal ratePerLtr, string? note, ManualMilkEntryKind kind, CancellationToken ct)
    {
        if (!await OwnsCustomerAsync(providerCustomerId, ct))
        {
            return null;
        }

        var entry = new ManualMilkEntry
        {
            ProviderCustomerId = providerCustomerId,
            Date = date,
            Slot = slot,
            Variety = NormalizeVariety(variety),
            QuantityLtr = quantityLtr,
            RatePerLtr = ratePerLtr,
            Kind = kind,
            Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim(),
            CreatedAt = clock.GetUtcNow(),
        };

        db.ManualMilkEntries.Add(entry);
        await db.SaveChangesAsync(ct);
        return ToDto(entry);
    }

    public async Task<ManualMilkEntryDto?> SetPaidAsync(Guid entryId, SetManualMilkPaidRequest request, CancellationToken ct)
    {
        var entry = await db.ManualMilkEntries
            .SingleOrDefaultAsync(e => e.Id == entryId && e.ProviderCustomer!.ProviderUserId == currentUser.UserId, ct);
        if (entry is null)
        {
            return null;
        }

        entry.IsPaid = request.IsPaid;
        await db.SaveChangesAsync(ct);
        return ToDto(entry);
    }

    public async Task<bool> DeleteAsync(Guid entryId, CancellationToken ct) =>
        await db.ManualMilkEntries
            .Where(e => e.Id == entryId && e.ProviderCustomer!.ProviderUserId == currentUser.UserId)
            .ExecuteDeleteAsync(ct) > 0;

    public async Task<MilkMonthDto?> GetMonthAsync(Guid providerCustomerId, int year, int month, CancellationToken ct)
    {
        var customer = await db.ProviderCustomers.AsNoTracking()
            .SingleOrDefaultAsync(c => c.Id == providerCustomerId && c.ProviderUserId == currentUser.UserId, ct);
        if (customer is null)
        {
            return null;
        }

        var (firstDay, lastDay, daysInMonth) = MonthRange(year, month);
        var entries = await db.ManualMilkEntries.AsNoTracking()
            .Where(e => e.ProviderCustomerId == providerCustomerId && e.Date >= firstDay && e.Date <= lastDay)
            .ToListAsync(ct);
        var regularByDateSlot = entries.Where(e => e.Kind == ManualMilkEntryKind.Regular)
            .GroupBy(e => (e.Date, e.Slot)).ToDictionary(g => g.Key, g => g.ToList());
        var ledgerDatesWithActivity = entries.Where(e => e.Kind != ManualMilkEntryKind.Regular).Select(e => e.Date).ToHashSet();

        var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);
        var days = new List<MilkCalendarDayDto>(daysInMonth);
        int deliveredDays = 0;
        decimal regularLitres = 0, regularAmount = 0;

        for (var date = firstDay; date <= lastDay; date = date.AddDays(1))
        {
            var morningEntries = regularByDateSlot.GetValueOrDefault((date, MilkSlot.Morning), []);
            var eveningEntries = regularByDateSlot.GetValueOrDefault((date, MilkSlot.Evening), []);
            var hasLedgerActivity = ledgerDatesWithActivity.Contains(date);

            decimal? morningQty = morningEntries.Count > 0 ? morningEntries.Sum(e => e.QuantityLtr)
                : customer.DefaultSlot == MilkSlot.Morning ? customer.DefaultQuantityLtr : null;
            decimal? eveningQty = eveningEntries.Count > 0 ? eveningEntries.Sum(e => e.QuantityLtr)
                : customer.DefaultSlot == MilkSlot.Evening ? customer.DefaultQuantityLtr : null;

            var morning = new MilkSlotStateDto(morningQty is not null, MilkCalendarStatus.Delivered, morningQty ?? 0, hasLedgerActivity);
            var evening = new MilkSlotStateDto(eveningQty is not null, MilkCalendarStatus.Delivered, eveningQty ?? 0, hasLedgerActivity);
            days.Add(new MilkCalendarDayDto(date, MilkCalendarStatus.Delivered, morning, evening));

            if (date > today)
            {
                continue;
            }

            if (morning.Enabled || evening.Enabled)
            {
                deliveredDays++;
            }

            regularLitres += (morning.Enabled ? morning.QuantityLtr : 0) + (evening.Enabled ? evening.QuantityLtr : 0);
            regularAmount += morningEntries.Count > 0
                ? morningEntries.Sum(e => e.QuantityLtr * e.RatePerLtr)
                : morning.Enabled ? morning.QuantityLtr * (customer.DefaultRatePerLtr ?? 0) : 0;
            regularAmount += eveningEntries.Count > 0
                ? eveningEntries.Sum(e => e.QuantityLtr * e.RatePerLtr)
                : evening.Enabled ? evening.QuantityLtr * (customer.DefaultRatePerLtr ?? 0) : 0;
        }

        var pastExtras = entries.Where(e => e.Kind == ManualMilkEntryKind.Extra && e.Date <= today).ToList();
        var extraLitres = pastExtras.Sum(e => e.QuantityLtr);
        var extraAmount = pastExtras.Sum(e => e.QuantityLtr * e.RatePerLtr);

        var pastReturns = entries.Where(e => e.Kind == ManualMilkEntryKind.Return && e.Date <= today).ToList();
        regularLitres -= pastReturns.Sum(e => e.QuantityLtr);
        regularAmount -= pastReturns.Sum(e => e.QuantityLtr * e.RatePerLtr);

        var loggedRegular = entries.Where(e => e.Kind == ManualMilkEntryKind.Regular && e.Date <= today).ToList();
        var isPaid = loggedRegular.Count > 0 && loggedRegular.All(e => e.IsPaid);

        var summary = new MilkMonthSummaryDto(
            deliveredDays, deliveredDays, 0, 0,
            regularLitres, extraLitres, customer.DefaultRatePerLtr ?? 0,
            regularAmount, extraAmount, regularAmount + extraAmount,
            isPaid, null);

        return new MilkMonthDto(days, summary);
    }

    public async Task<IReadOnlyList<ManualMilkDaySummaryDto>> GetProviderMonthSummaryAsync(int year, int month, CancellationToken ct)
    {
        var customers = await MyMilkCustomersAsync(ct);
        if (customers.Count == 0)
        {
            return [];
        }

        var (firstDay, lastDay, daysInMonth) = MonthRange(year, month);
        var customerIds = customers.Select(c => c.Id).ToList();
        var entries = await db.ManualMilkEntries.AsNoTracking()
            .Where(e => customerIds.Contains(e.ProviderCustomerId) && e.Date >= firstDay && e.Date <= lastDay)
            .ToListAsync(ct);
        var regularByCustomerDateSlot = entries.Where(e => e.Kind == ManualMilkEntryKind.Regular)
            .GroupBy(e => (e.ProviderCustomerId, e.Date, e.Slot)).ToDictionary(g => g.Key, g => g.ToList());
        var extrasByCustomerDate = entries.Where(e => e.Kind == ManualMilkEntryKind.Extra)
            .GroupBy(e => (e.ProviderCustomerId, e.Date)).ToDictionary(g => g.Key, g => g.ToList());
        var returnsByCustomerDate = entries.Where(e => e.Kind == ManualMilkEntryKind.Return)
            .GroupBy(e => (e.ProviderCustomerId, e.Date)).ToDictionary(g => g.Key, g => g.ToList());

        var summaries = new List<ManualMilkDaySummaryDto>(daysInMonth);
        for (var date = firstDay; date <= lastDay; date = date.AddDays(1))
        {
            int customerCount = 0;
            decimal plannedLitres = 0, loggedLitres = 0, amount = 0;

            foreach (var customer in customers)
            {
                var morningEntries = regularByCustomerDateSlot.GetValueOrDefault((customer.Id, date, MilkSlot.Morning), []);
                var eveningEntries = regularByCustomerDateSlot.GetValueOrDefault((customer.Id, date, MilkSlot.Evening), []);
                var hasAnyEntry = morningEntries.Count > 0 || eveningEntries.Count > 0;
                var hasPlan = customer.DefaultQuantityLtr is not null;
                if (!hasAnyEntry && !hasPlan)
                {
                    continue;
                }

                customerCount++;
                var loggedQty = morningEntries.Sum(e => e.QuantityLtr) + eveningEntries.Sum(e => e.QuantityLtr);
                plannedLitres += hasPlan ? customer.DefaultQuantityLtr!.Value : loggedQty;
                loggedLitres += loggedQty;
                amount += morningEntries.Sum(e => e.QuantityLtr * e.RatePerLtr) + eveningEntries.Sum(e => e.QuantityLtr * e.RatePerLtr);

                if (extrasByCustomerDate.TryGetValue((customer.Id, date), out var extras))
                {
                    loggedLitres += extras.Sum(e => e.QuantityLtr);
                    amount += extras.Sum(e => e.QuantityLtr * e.RatePerLtr);
                }

                if (returnsByCustomerDate.TryGetValue((customer.Id, date), out var returns))
                {
                    loggedLitres -= returns.Sum(e => e.QuantityLtr);
                    amount -= returns.Sum(e => e.QuantityLtr * e.RatePerLtr);
                }
            }

            summaries.Add(new ManualMilkDaySummaryDto(date, customerCount, plannedLitres, loggedLitres, amount));
        }

        return summaries;
    }

    public async Task<IReadOnlyList<ManualMilkDayCustomerDto>> GetDayDetailAsync(DateOnly date, CancellationToken ct)
    {
        var customers = await MyMilkCustomersAsync(ct);
        if (customers.Count == 0)
        {
            return [];
        }

        var customerIds = customers.Select(c => c.Id).ToList();
        var regularEntries = await db.ManualMilkEntries.AsNoTracking()
            .Where(e => customerIds.Contains(e.ProviderCustomerId) && e.Date == date && e.Kind == ManualMilkEntryKind.Regular)
            .ToListAsync(ct);
        // A customer can have an entry in each slot (and each variety) the same day — group rather than assume one.
        var regularByCustomer = regularEntries.GroupBy(e => e.ProviderCustomerId).ToDictionary(g => g.Key, g => g.ToList());

        return customers
            .Where(c => c.DefaultQuantityLtr is not null || regularByCustomer.ContainsKey(c.Id))
            .Select(c =>
            {
                var customerEntries = regularByCustomer.GetValueOrDefault(c.Id, []);
                var primary = customerEntries.FirstOrDefault(e => e.Slot == c.DefaultSlot && e.Variety == c.DefaultVariety)
                    ?? customerEntries.FirstOrDefault();
                var planned = c.DefaultQuantityLtr ?? customerEntries.Sum(e => e.QuantityLtr);
                return new ManualMilkDayCustomerDto(c.Id, c.Name, planned, primary is null ? null : ToDto(primary));
            })
            .OrderBy(d => d.CustomerName)
            .ToList();
    }

    private Task<List<ProviderCustomer>> MyMilkCustomersAsync(CancellationToken ct) =>
        db.ProviderCustomers.AsNoTracking()
            .Where(c => c.ProviderUserId == currentUser.UserId && c.ArchivedAt == null && c.Category == ServiceContactCategory.Milk)
            .ToListAsync(ct);

    private static (DateOnly FirstDay, DateOnly LastDay, int DaysInMonth) MonthRange(int year, int month)
    {
        var firstDay = new DateOnly(year, month, 1);
        var daysInMonth = DateTime.DaysInMonth(year, month);
        return (firstDay, firstDay.AddDays(daysInMonth - 1), daysInMonth);
    }

    private Task<bool> OwnsCustomerAsync(Guid providerCustomerId, CancellationToken ct) =>
        db.ProviderCustomers.AnyAsync(c => c.Id == providerCustomerId && c.ProviderUserId == currentUser.UserId, ct);

    private static string? NormalizeVariety(string? variety) => string.IsNullOrWhiteSpace(variety) ? null : variety.Trim();

    private static ManualMilkEntryDto ToDto(ManualMilkEntry e) =>
        new(e.Id, e.Date, e.Slot, e.Variety, e.QuantityLtr, e.RatePerLtr, e.QuantityLtr * e.RatePerLtr, e.Kind, e.Note, e.IsPaid);
}
