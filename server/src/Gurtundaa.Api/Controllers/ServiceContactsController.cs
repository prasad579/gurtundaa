using Gurtundaa.Application.ServiceContacts;
using Gurtundaa.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/service-contacts")]
public class ServiceContactsController(IServiceContactService contacts) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<ServiceContactDto>> List([FromQuery] ServiceContactCategory category, CancellationToken ct) =>
        await contacts.ListAsync(category, ct);

    [HttpPost]
    public async Task<ActionResult<ServiceContactDto>> Create(SaveServiceContactRequest request, CancellationToken ct)
    {
        var created = await contacts.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), new { category = created.Category }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ServiceContactDto>> Update(Guid id, SaveServiceContactRequest request, CancellationToken ct) =>
        await contacts.UpdateAsync(id, request, ct) is { } contact ? Ok(contact) : NotFound();

    [HttpPatch("{id:guid}/default")]
    public async Task<ActionResult<ServiceContactDto>> SetDefault(Guid id, CancellationToken ct) =>
        await contacts.SetDefaultAsync(id, ct) is { } contact ? Ok(contact) : NotFound();

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        await contacts.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
