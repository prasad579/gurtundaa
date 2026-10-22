using System.Text.Json;
using Gurtundaa.Application.Common;
using Gurtundaa.Application.Laundry;
using Gurtundaa.Application.Providers;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Providers;

public class ManualLaundryService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IManualLaundryService
{
    public async Task<IReadOnlyList<ManualLaundryBatchDto>> ListAsync(Guid providerCustomerId, CancellationToken ct)
    {
        if (!await OwnsCustomerAsync(providerCustomerId, ct))
        {
            return [];
        }

        var batches = await db.ManualLaundryBatches.AsNoTracking()
            .Where(b => b.ProviderCustomerId == providerCustomerId)
            .OrderByDescending(b => b.GivenOn)
            .ToListAsync(ct);
        return batches.Select(ToDto).ToList();
    }

    public async Task<ManualLaundryBatchDto?> CreateAsync(Guid providerCustomerId, SaveManualLaundryBatchRequest request, CancellationToken ct)
    {
        if (!await OwnsCustomerAsync(providerCustomerId, ct))
        {
            return null;
        }

        var now = clock.GetUtcNow();
        var batch = new ManualLaundryBatch
        {
            ProviderCustomerId = providerCustomerId,
            ServiceType = request.ServiceType,
            GivenOn = request.GivenOn,
            ExpectedReturn = request.ExpectedReturn,
            ItemsJson = JsonSerializer.Serialize(request.Items),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            CreatedAt = now,
            UpdatedAt = now,
        };

        db.ManualLaundryBatches.Add(batch);
        await db.SaveChangesAsync(ct);
        return ToDto(batch);
    }

    public async Task<ManualLaundryBatchDto?> MarkPickedUpAsync(Guid batchId, MarkManualPickedUpRequest request, CancellationToken ct)
    {
        var batch = await Mine().SingleOrDefaultAsync(b => b.Id == batchId, ct);
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
            batch.ItemsJson = JsonSerializer.Serialize(request.Items);
        }
        batch.UpdatedAt = now;

        await db.SaveChangesAsync(ct);
        return ToDto(batch);
    }

    public async Task<ManualLaundryBatchDto?> SetPaidAsync(Guid batchId, SetManualLaundryPaidRequest request, CancellationToken ct)
    {
        var batch = await Mine().SingleOrDefaultAsync(b => b.Id == batchId, ct);
        if (batch is null)
        {
            return null;
        }

        batch.IsPaid = request.IsPaid;
        batch.PaidAt = request.IsPaid ? clock.GetUtcNow() : null;
        batch.UpdatedAt = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);
        return ToDto(batch);
    }

    public async Task<bool> DeleteAsync(Guid batchId, CancellationToken ct) =>
        await Mine().Where(b => b.Id == batchId).ExecuteDeleteAsync(ct) > 0;

    private IQueryable<ManualLaundryBatch> Mine() =>
        db.ManualLaundryBatches.Where(b => b.ProviderCustomer!.ProviderUserId == currentUser.UserId);

    private Task<bool> OwnsCustomerAsync(Guid providerCustomerId, CancellationToken ct) =>
        db.ProviderCustomers.AnyAsync(c => c.Id == providerCustomerId && c.ProviderUserId == currentUser.UserId, ct);

    private static ManualLaundryBatchDto ToDto(ManualLaundryBatch batch)
    {
        var items = JsonSerializer.Deserialize<List<LaundryItemLine>>(batch.ItemsJson) ?? [];
        return new ManualLaundryBatchDto(
            batch.Id, batch.ServiceType, batch.GivenOn, batch.ExpectedReturn, batch.Status, batch.PickedUpOn,
            batch.Amount, batch.IsPaid, items, batch.Notes, batch.CreatedAt);
    }
}
