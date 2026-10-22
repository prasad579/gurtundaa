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

    [HttpGet("unseen-count")]
    public async Task<int> GetUnseenCount(CancellationToken ct) => await activity.GetUnseenProviderActivityCountAsync(ct);

    [HttpPost("mark-seen")]
    public async Task<IActionResult> MarkSeen(CancellationToken ct)
    {
        await activity.MarkProviderActivitySeenAsync(ct);
        return NoContent();
    }
}
