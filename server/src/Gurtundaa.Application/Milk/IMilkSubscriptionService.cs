namespace Gurtundaa.Application.Milk;

public interface IMilkSubscriptionService
{
    Task<MilkSubscriptionDto?> GetAsync(CancellationToken ct);

    Task<MilkSubscriptionDto> SaveAsync(SaveMilkSubscriptionRequest request, CancellationToken ct);
}
