namespace Gurtundaa.Domain.Entities;

public class DoseLog
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid MedicineId { get; set; }

    public Medicine? Medicine { get; set; }

    public DateOnly Date { get; set; }

    public DoseSlot Slot { get; set; }

    public DoseStatus Status { get; set; }

    public DateTimeOffset? TakenAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum DoseSlot
{
    Morning = 0,
    Afternoon = 1,
    Evening = 2,
    Night = 3,
}

public enum DoseStatus
{
    Taken = 0,
    Skipped = 1,
}
