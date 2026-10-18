using Gurtundaa.Application.Milk;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/milk/activity")]
public class MilkActivityController(IMilkActivityService activity) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<MilkActivityItemDto>> Get([FromQuery] int take, CancellationToken ct) =>
        await activity.GetRecentAsync(take <= 0 ? 10 : take, ct);
}
