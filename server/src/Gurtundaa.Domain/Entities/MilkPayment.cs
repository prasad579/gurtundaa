namespace Gurtundaa.Domain.Entities;

/// <summary>A single payment a household logs against their milkman — any amount, any day, as many as they like per month. Lets them pay daily/weekly/whenever instead of only the all-or-nothing monthly "Mark as Paid" toggle.</summary>
public class MilkPayment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    /// <summary>The day the household is recording this payment against — usually today, but editable.</summary>
    public DateOnly Date { get; set; }

    public decimal Amount { get; set; }

    public string? Note { get; set; }

    public PaymentMethod Method { get; set; } = PaymentMethod.Cash;

    /// <summary>Cash (and any other in-person method) is self-declared and counts immediately, same as before this field existed. UPI payments go through the milkman/dhobi confirming they actually received the money first — the app has no way to verify a UPI transfer on its own.</summary>
    public PaymentStatus Status { get; set; } = PaymentStatus.Confirmed;

    public DateTimeOffset? ConfirmedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum PaymentMethod
{
    Cash = 0,
    Upi = 1,
    Other = 2,
}

public enum PaymentStatus
{
    Confirmed = 0,
    AwaitingConfirmation = 1,
    Rejected = 2,
}
