using Gurtundaa.Application.Milk;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/milk/quantity-changes")]
public class MilkQuantityChangesController(IMilkQuantityChangeService quantityChanges) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<MilkQuantityChangeDto>> List([FromQuery] bool upcoming, CancellationToken ct) =>
        await quantityChanges.ListAsync(upcoming, ct);

    [HttpPost]
    public async Task<ActionResult<MilkQuantityChangeDto>> Create(SaveMilkQuantityChangeRequest request, CancellationToken ct)
    {
        var created = await quantityChanges.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<MilkQuantityChangeDto>> Update(Guid id, SaveMilkQuantityChangeRequest request, CancellationToken ct) =>
        await quantityChanges.UpdateAsync(id, request, ct) is { } change ? Ok(change) : NotFound();

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        await quantityChanges.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
