using Gurtundaa.Application.Health;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/health/prescriptions")]
public class PrescriptionsController(IPrescriptionService prescriptions) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<PrescriptionDto>> List(CancellationToken ct) => await prescriptions.ListAsync(ct);

    [HttpPost]
    public async Task<ActionResult<PrescriptionDto>> Create(SavePrescriptionRequest request, CancellationToken ct)
    {
        var created = await prescriptions.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), created);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        await prescriptions.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
