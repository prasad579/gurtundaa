using Gurtundaa.Application.Providers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/laundry/pickup-requests")]
public class LaundryPickupRequestsController(ILaundryPickupRequestService pickupRequests) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<LaundryPickupRequestDto>> Create(CreatePickupRequestRequest request, CancellationToken ct)
    {
        var result = await pickupRequests.CreateAsync(request, ct);
        return result.Succeeded ? Ok(result.Value) : Problem(title: string.Join(" ", result.Errors), statusCode: StatusCodes.Status400BadRequest);
    }

    [Authorize(Roles = "LaundryProvider")]
    [HttpGet("pending")]
    public async Task<IReadOnlyList<LaundryPickupRequestDto>> ListPending(CancellationToken ct) =>
        await pickupRequests.ListPendingForProviderAsync(ct);

    [Authorize(Roles = "LaundryProvider")]
    [HttpPost("{id:guid}/handled")]
    public async Task<IActionResult> MarkHandled(Guid id, CancellationToken ct) =>
        await pickupRequests.MarkHandledAsync(id, ct) ? NoContent() : NotFound();
}
