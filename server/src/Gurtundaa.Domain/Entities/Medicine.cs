namespace Gurtundaa.Domain.Entities;

public class Medicine
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public AppUser? User { get; set; }

    public Guid MemberId { get; set; }

    public HouseholdMember? Member { get; set; }

    public Guid? PrescriptionId { get; set; }

    public Prescription? Prescription { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>What it's for (e.g. "sugar control", "BP") — optional, just a memory aid for the household.</summary>
    public string? Purpose { get; set; }

    public MedicineMode Mode { get; set; } = MedicineMode.Daily;

    public int? CourseDays { get; set; }

    public int MorningQty { get; set; }

    public int AfternoonQty { get; set; }

    public int EveningQty { get; set; }

    public int NightQty { get; set; }

    public FoodTiming FoodTiming { get; set; } = FoodTiming.AnyTime;

    /// <summary>Current tablets in hand — mutated by dose-taking (decrement) and refills (increment), not recomputed from history.</summary>
    public int StockCount { get; set; }

    public DateOnly StartDate { get; set; }

    /// <summary>Optional reminder of when to see the doctor next for this medicine/condition.</summary>
    public DateOnly? NextVisitDate { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum MedicineMode
{
    Daily = 0,
    Course = 1,
}

public enum FoodTiming
{
    AnyTime = 0,
    BeforeFood = 1,
    AfterFood = 2,
}
