using Gurtundaa.Application.Common;
using Gurtundaa.Application.Providers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/provider-links")]
public class ProviderLinksController(IProviderLinkService links) : ControllerBase
{
    [HttpGet("by-contact/{serviceContactId:guid}")]
    public async Task<ActionResult<ProviderLinkDto>> GetForContact(Guid serviceContactId, CancellationToken ct) =>
        await links.GetForContactAsync(serviceContactId, ct) is { } link ? Ok(link) : NoContent();

    [HttpPost]
    public async Task<ActionResult<ProviderLinkDto>> CreateInvite(CreateProviderInviteRequest request, CancellationToken ct) =>
        await links.CreateInviteAsync(request, ct) is { } link ? Ok(link) : NotFound();

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Revoke(Guid id, CancellationToken ct) =>
        await links.RevokeAsync(id, ct) ? NoContent() : NotFound();

    [HttpPost("claim")]
    public async Task<ActionResult<ProviderLinkDto>> Claim(ClaimProviderInviteRequest request, CancellationToken ct)
    {
        var result = await links.ClaimAsync(request, ct);
        return result.Succeeded ? Ok(result.Value) : Problem(title: string.Join(" ", result.Errors), statusCode: StatusCodes.Status400BadRequest);
    }
}
