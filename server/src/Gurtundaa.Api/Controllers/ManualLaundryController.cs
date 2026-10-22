using Gurtundaa.Application.Providers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize(Roles = "LaundryProvider")]
[Route("api/provider-customers/{providerCustomerId:guid}/laundry-batches")]
public class ManualLaundryController(IManualLaundryService laundry) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<ManualLaundryBatchDto>> List(Guid providerCustomerId, CancellationToken ct) =>
        await laundry.ListAsync(providerCustomerId, ct);

    [HttpPost]
    public async Task<ActionResult<ManualLaundryBatchDto>> Create(Guid providerCustomerId, SaveManualLaundryBatchRequest request, CancellationToken ct) =>
        await laundry.CreateAsync(providerCustomerId, request, ct) is { } batch ? Ok(batch) : NotFound();

    [HttpPatch("{batchId:guid}/pickup")]
    public async Task<ActionResult<ManualLaundryBatchDto>> MarkPickedUp(Guid batchId, MarkManualPickedUpRequest request, CancellationToken ct) =>
        await laundry.MarkPickedUpAsync(batchId, request, ct) is { } batch ? Ok(batch) : NotFound();

    [HttpPatch("{batchId:guid}/paid")]
    public async Task<ActionResult<ManualLaundryBatchDto>> SetPaid(Guid batchId, SetManualLaundryPaidRequest request, CancellationToken ct) =>
        await laundry.SetPaidAsync(batchId, request, ct) is { } batch ? Ok(batch) : NotFound();

    [HttpDelete("{batchId:guid}")]
    public async Task<IActionResult> Delete(Guid batchId, CancellationToken ct) =>
        await laundry.DeleteAsync(batchId, ct) ? NoContent() : NotFound();
}
