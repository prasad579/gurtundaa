using Gurtundaa.Application.Household;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/household")]
public class HouseholdController(IHouseholdProfileService household) : ControllerBase
{
    [HttpGet("profile")]
    public async Task<ActionResult<HouseholdProfileDto>> Get(CancellationToken ct) =>
        await household.GetAsync(ct) is { } profile ? Ok(profile) : NoContent();

    [HttpPut("profile")]
    public async Task<ActionResult<HouseholdProfileDto>> Save(SaveHouseholdProfileRequest request, CancellationToken ct) =>
        Ok(await household.SaveAsync(request, ct));
}
