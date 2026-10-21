using Gurtundaa.Application.Health;
using Gurtundaa.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/health/doses")]
public class DoseLogController(IDoseLogService doses) : ControllerBase
{
    [HttpGet("today")]
    public async Task<IReadOnlyList<DoseEntryDto>> GetToday(CancellationToken ct) => await doses.GetTodayAsync(ct);

    [HttpPatch("{medicineId:guid}/{date}/{slot}")]
    public async Task<ActionResult<DoseEntryDto>> SetStatus(
        Guid medicineId,
        DateOnly date,
        DoseSlot slot,
        SetDoseStatusRequest request,
        CancellationToken ct) =>
        await doses.SetStatusAsync(medicineId, date, slot, request, ct) is { } entry ? Ok(entry) : NotFound();
}
