using System.Linq.Expressions;
using Gurtundaa.Application.Common;
using Gurtundaa.Application.ServiceContacts;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.ServiceContacts;

public class ServiceContactService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IServiceContactService
{
    private static readonly Expression<Func<ServiceContact, ServiceContactDto>> ToDtoExpression =
        c => new ServiceContactDto(c.Id, c.Category, c.Name, c.Phone, c.Address, c.IsDefault, c.CreatedAt);

    private static readonly Func<ServiceContact, ServiceContactDto> ToDto = ToDtoExpression.Compile();

    private IQueryable<ServiceContact> Mine => db.ServiceContacts.Where(c => c.UserId == currentUser.UserId);

    public async Task<IReadOnlyList<ServiceContactDto>> ListAsync(ServiceContactCategory category, CancellationToken ct) =>
        await Mine.AsNoTracking()
            .Where(c => c.Category == category)
            .OrderByDescending(c => c.IsDefault)
            .ThenBy(c => c.Name)
            .Select(ToDtoExpression)
            .ToListAsync(ct);

    public async Task<ServiceContactDto> CreateAsync(SaveServiceContactRequest request, CancellationToken ct)
    {
        if (request.IsDefault)
        {
            await ClearDefaultAsync(request.Category, ct);
        }

        var contact = new ServiceContact
        {
            UserId = currentUser.UserId,
            Category = request.Category,
            CreatedAt = clock.GetUtcNow(),
        };
        Apply(contact, request);

        db.ServiceContacts.Add(contact);
        await db.SaveChangesAsync(ct);
        return ToDto(contact);
    }

    public async Task<ServiceContactDto?> UpdateAsync(Guid id, SaveServiceContactRequest request, CancellationToken ct)
    {
        var contact = await Mine.SingleOrDefaultAsync(c => c.Id == id, ct);
        if (contact is null)
        {
            return null;
        }

        if (request.IsDefault && !contact.IsDefault)
        {
            await ClearDefaultAsync(request.Category, ct);
        }

        Apply(contact, request);
        await db.SaveChangesAsync(ct);
        return ToDto(contact);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct)
    {
        // No DB-level ON DELETE SET NULL here (see MilkSubscriptionConfiguration /
        // LaundryBatchConfiguration), so clear every reference to this contact before removing it.
        await db.MilkSubscriptions
            .Where(s => s.UserId == currentUser.UserId && s.ContactId == id)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.ContactId, (Guid?)null), ct);

        await db.LaundryBatches
            .Where(b => b.UserId == currentUser.UserId && b.ContactId == id)
            .ExecuteUpdateAsync(b => b.SetProperty(x => x.ContactId, (Guid?)null), ct);

        await db.ProviderLinks
            .Where(l => l.HouseholdUserId == currentUser.UserId && l.ServiceContactId == id)
            .ExecuteDeleteAsync(ct);

        return await Mine.Where(c => c.Id == id).ExecuteDeleteAsync(ct) > 0;
    }

    public async Task<ServiceContactDto?> SetDefaultAsync(Guid id, CancellationToken ct)
    {
        var contact = await Mine.SingleOrDefaultAsync(c => c.Id == id, ct);
        if (contact is null)
        {
            return null;
        }

        await ClearDefaultAsync(contact.Category, ct);
        contact.IsDefault = true;
        await db.SaveChangesAsync(ct);
        return ToDto(contact);
    }

    private Task ClearDefaultAsync(ServiceContactCategory category, CancellationToken ct) =>
        Mine.Where(c => c.Category == category && c.IsDefault)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.IsDefault, false), ct);

    private static void Apply(ServiceContact contact, SaveServiceContactRequest request)
    {
        contact.Name = request.Name.Trim();
        contact.Phone = request.Phone.Trim();
        contact.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        contact.IsDefault = request.IsDefault;
    }
}
