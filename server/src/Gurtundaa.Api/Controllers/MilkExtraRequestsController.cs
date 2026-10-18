using Gurtundaa.Application.Milk;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/milk/extra-requests")]
public class MilkExtraRequestsController(IMilkExtraRequestService extraRequests) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<MilkExtraRequestDto>> List([FromQuery] bool upcoming, CancellationToken ct) =>
        await extraRequests.ListAsync(upcoming, ct);

    [HttpPost]
    public async Task<ActionResult<MilkExtraRequestDto>> Create(SaveMilkExtraRequestRequest request, CancellationToken ct)
    {
        var created = await extraRequests.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), created);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        await extraRequests.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
