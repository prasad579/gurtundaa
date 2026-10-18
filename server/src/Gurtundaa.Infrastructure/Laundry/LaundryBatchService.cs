using System.Text.Json;
using Gurtundaa.Application.Common;
using Gurtundaa.Application.Laundry;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Laundry;

public class LaundryBatchService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : ILaundryBatchService
{
    private IQueryable<LaundryBatch> Mine => db.LaundryBatches.Where(b => b.UserId == currentUser.UserId);

    public async Task<IReadOnlyList<LaundryBatchDto>> ListAsync(LaundryBatchFilter filter, CancellationToken ct)
    {
        var query = Mine.AsNoTracking().Include(b => b.Contact).AsQueryable();

        query = filter switch
        {
            LaundryBatchFilter.Active => query.Where(b => b.Status == LaundryBatchStatus.Active),
            LaundryBatchFilter.PickedUp => query.Where(b => b.Status == LaundryBatchStatus.PickedUp),
            _ => query,
        };

        query = filter == LaundryBatchFilter.PickedUp
            ? query.OrderByDescending(b => b.PickedUpOn)
            : query.OrderByDescending(b => b.GivenOn);

        var batches = await query.ToListAsync(ct);
        return batches.Select(b => ToDto(b)).ToList();
    }

    public async Task<LaundryBatchDto> CreateAsync(SaveLaundryBatchRequest request, CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var batch = new LaundryBatch
        {
            UserId = currentUser.UserId,
            CreatedAt = now,
        };
        Apply(batch, request, now);

        db.LaundryBatches.Add(batch);
        await db.SaveChangesAsync(ct);

        var contact = await LoadContactAsync(batch.ContactId, ct);
        return ToDto(batch, contact);
    }

    public async Task<LaundryBatchDto?> UpdateAsync(Guid id, SaveLaundryBatchRequest request, CancellationToken ct)
    {
        var batch = await Mine.SingleOrDefaultAsync(b => b.Id == id, ct);
        if (batch is null)
        {
            return null;
        }

        Apply(batch, request, clock.GetUtcNow());
        await db.SaveChangesAsync(ct);

        var contact = await LoadContactAsync(batch.ContactId, ct);
        return ToDto(batch, contact);
    }

    public async Task<LaundryBatchDto?> MarkPickedUpAsync(Guid id, MarkPickedUpRequest request, CancellationToken ct)
    {
        var batch = await Mine.SingleOrDefaultAsync(b => b.Id == id, ct);
        if (batch is null)
        {
            return null;
        }

        var now = clock.GetUtcNow();
        batch.Status = LaundryBatchStatus.PickedUp;
        batch.PickedUpOn = DateOnly.FromDateTime(now.LocalDateTime);
        batch.Amount = request.Amount;
        if (request.Items is not null)
        {
            // Carries per-item prices entered at pickup time back into storage so the breakdown
            // (not just the total) is preserved for history/display.
            batch.ItemsJson = JsonSerializer.Serialize(request.Items);
        }
        batch.UpdatedAt = now;

        await db.SaveChangesAsync(ct);

        var contact = await LoadContactAsync(batch.ContactId, ct);
        return ToDto(batch, contact);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct) =>
        await Mine.Where(b => b.Id == id).ExecuteDeleteAsync(ct) > 0;

    private Task<ServiceContact?> LoadContactAsync(Guid? contactId, CancellationToken ct) =>
        contactId is null
            ? Task.FromResult<ServiceContact?>(null)
            : db.ServiceContacts.AsNoTracking().SingleOrDefaultAsync(c => c.Id == contactId, ct);

    private static void Apply(LaundryBatch batch, SaveLaundryBatchRequest request, DateTimeOffset now)
    {
        batch.ContactId = request.ContactId;
        batch.ServiceType = request.ServiceType;
        batch.GivenOn = request.GivenOn;
        batch.ExpectedReturn = request.ExpectedReturn;
        batch.ItemsJson = JsonSerializer.Serialize(request.Items);
        batch.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        batch.UpdatedAt = now;
    }

    private static LaundryBatchDto ToDto(LaundryBatch batch, ServiceContact? contact = null)
    {
        contact ??= batch.Contact;
        var items = JsonSerializer.Deserialize<List<LaundryItemLine>>(batch.ItemsJson) ?? [];
        return new LaundryBatchDto(
            batch.Id,
            batch.ContactId,
            contact?.Name,
            contact?.Phone,
            batch.ServiceType,
            batch.GivenOn,
            batch.ExpectedReturn,
            batch.Status,
            batch.PickedUpOn,
            batch.Amount,
            items,
            batch.Notes,
            batch.CreatedAt);
    }
}
