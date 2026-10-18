using Gurtundaa.Application.Milk;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/milk/subscription")]
public class MilkSubscriptionController(IMilkSubscriptionService subscription) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<MilkSubscriptionDto>> Get(CancellationToken ct) =>
        await subscription.GetAsync(ct) is { } dto ? Ok(dto) : NoContent();

    [HttpPut]
    public async Task<ActionResult<MilkSubscriptionDto>> Save(SaveMilkSubscriptionRequest request, CancellationToken ct) =>
        Ok(await subscription.SaveAsync(request, ct));
}
