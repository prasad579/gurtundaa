using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Application.ServiceContacts;

public interface IServiceContactService
{
    Task<IReadOnlyList<ServiceContactDto>> ListAsync(ServiceContactCategory category, CancellationToken ct);

    Task<ServiceContactDto> CreateAsync(SaveServiceContactRequest request, CancellationToken ct);

    Task<ServiceContactDto?> UpdateAsync(Guid id, SaveServiceContactRequest request, CancellationToken ct);

    Task<bool> DeleteAsync(Guid id, CancellationToken ct);

    Task<ServiceContactDto?> SetDefaultAsync(Guid id, CancellationToken ct);
}
