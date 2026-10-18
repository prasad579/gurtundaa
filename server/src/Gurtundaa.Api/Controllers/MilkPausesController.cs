using Gurtundaa.Application.Milk;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/milk/pauses")]
public class MilkPausesController(IMilkPauseService pauses) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<MilkPauseDto>> List([FromQuery] bool upcoming, CancellationToken ct) =>
        await pauses.ListAsync(upcoming, ct);

    [HttpPost]
    public async Task<ActionResult<MilkPauseDto>> Create(SaveMilkPauseRequest request, CancellationToken ct)
    {
        var created = await pauses.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<MilkPauseDto>> Update(Guid id, SaveMilkPauseRequest request, CancellationToken ct) =>
        await pauses.UpdateAsync(id, request, ct) is { } pause ? Ok(pause) : NotFound();

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        await pauses.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
