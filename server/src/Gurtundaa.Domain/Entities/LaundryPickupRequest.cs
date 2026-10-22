namespace Gurtundaa.Domain.Entities;

/// <summary>A household asking their linked dhobi to come collect laundry on a given date — an in-app alternative to calling/WhatsApp-ing them directly.</summary>
public class LaundryPickupRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid HouseholdUserId { get; set; }

    public AppUser? HouseholdUser { get; set; }

    public Guid ProviderUserId { get; set; }

    public AppUser? ProviderUser { get; set; }

    public DateOnly RequestedDate { get; set; }

    public string? Note { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? HandledAt { get; set; }
}
