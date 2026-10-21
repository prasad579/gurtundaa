using Gurtundaa.Application.Health;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/health/members")]
public class HouseholdMembersController(IHouseholdMemberService members) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<HouseholdMemberDto>> List(CancellationToken ct) => await members.ListAsync(ct);

    [HttpPost]
    public async Task<ActionResult<HouseholdMemberDto>> Create(SaveHouseholdMemberRequest request, CancellationToken ct)
    {
        var created = await members.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<HouseholdMemberDto>> Update(Guid id, SaveHouseholdMemberRequest request, CancellationToken ct) =>
        await members.UpdateAsync(id, request, ct) is { } member ? Ok(member) : NotFound();

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        await members.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
