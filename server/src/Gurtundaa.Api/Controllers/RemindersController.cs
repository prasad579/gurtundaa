using Gurtundaa.Application.Reminders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/reminders")]
public class RemindersController(IReminderService reminders) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<ReminderDto>> List([FromQuery] ReminderFilter filter, CancellationToken ct) =>
        await reminders.ListAsync(filter, ct);

    [HttpGet("stats")]
    public async Task<ReminderStats> Stats(CancellationToken ct) => await reminders.GetStatsAsync(ct);

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ReminderDto>> Get(Guid id, CancellationToken ct) =>
        await reminders.GetAsync(id, ct) is { } reminder ? Ok(reminder) : NotFound();

    [HttpPost]
    public async Task<ActionResult<ReminderDto>> Create(SaveReminderRequest request, CancellationToken ct)
    {
        var created = await reminders.CreateAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ReminderDto>> Update(Guid id, SaveReminderRequest request, CancellationToken ct) =>
        await reminders.UpdateAsync(id, request, ct) is { } reminder ? Ok(reminder) : NotFound();

    [HttpPatch("{id:guid}/done")]
    public async Task<ActionResult<ReminderDto>> SetDone(Guid id, [FromQuery] bool value, CancellationToken ct) =>
        await reminders.SetDoneAsync(id, value, ct) is { } reminder ? Ok(reminder) : NotFound();

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        await reminders.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
