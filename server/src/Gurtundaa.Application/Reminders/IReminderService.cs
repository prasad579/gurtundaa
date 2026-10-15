namespace Gurtundaa.Application.Reminders;

public interface IReminderService
{
    Task<IReadOnlyList<ReminderDto>> ListAsync(ReminderFilter filter, CancellationToken ct);

    Task<ReminderDto?> GetAsync(Guid id, CancellationToken ct);

    Task<ReminderDto> CreateAsync(SaveReminderRequest request, CancellationToken ct);

    Task<ReminderDto?> UpdateAsync(Guid id, SaveReminderRequest request, CancellationToken ct);

    Task<ReminderDto?> SetDoneAsync(Guid id, bool isDone, CancellationToken ct);

    Task<bool> DeleteAsync(Guid id, CancellationToken ct);

    Task<ReminderStats> GetStatsAsync(CancellationToken ct);
}
