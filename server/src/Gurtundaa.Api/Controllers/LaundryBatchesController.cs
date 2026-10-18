using Gurtundaa.Application.Laundry;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/laundry/batches")]
public class LaundryBatchesController(ILaundryBatchService batches) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<LaundryBatchDto>> List([FromQuery] LaundryBatchFilter filter, CancellationToken ct) =>
        await batches.ListAsync(filter, ct);

    [HttpPost]
    public async Task<ActionResult<LaundryBatchDto>> Create(SaveLaundryBatchRequest request, CancellationToken ct)
    {
        var created = await batches.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<LaundryBatchDto>> Update(Guid id, SaveLaundryBatchRequest request, CancellationToken ct) =>
        await batches.UpdateAsync(id, request, ct) is { } batch ? Ok(batch) : NotFound();

    [HttpPatch("{id:guid}/pickup")]
    public async Task<ActionResult<LaundryBatchDto>> MarkPickedUp(Guid id, MarkPickedUpRequest request, CancellationToken ct) =>
        await batches.MarkPickedUpAsync(id, request, ct) is { } batch ? Ok(batch) : NotFound();

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        await batches.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
