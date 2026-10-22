using Gurtundaa.Application.Common;
using Gurtundaa.Application.Providers;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Providers;

public class ProviderPaymentSettingsService(AppDbContext db, ICurrentUser currentUser) : IProviderPaymentSettingsService
{
    public async Task<ProviderPaymentSettingsDto> GetAsync(CancellationToken ct)
    {
        var upiId = await db.Users.AsNoTracking()
            .Where(u => u.Id == currentUser.UserId)
            .Select(u => u.UpiId)
            .SingleAsync(ct);
        return new ProviderPaymentSettingsDto(upiId);
    }

    public async Task<ProviderPaymentSettingsDto> SaveAsync(SaveProviderPaymentSettingsRequest request, CancellationToken ct)
    {
        var user = await db.Users.SingleAsync(u => u.Id == currentUser.UserId, ct);
        user.UpiId = string.IsNullOrWhiteSpace(request.UpiId) ? null : request.UpiId.Trim();
        await db.SaveChangesAsync(ct);
        return new ProviderPaymentSettingsDto(user.UpiId);
    }
}
