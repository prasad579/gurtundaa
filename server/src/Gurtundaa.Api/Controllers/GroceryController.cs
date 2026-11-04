using Gurtundaa.Application.Grocery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/grocery-items")]
public class GroceryController(IGroceryService grocery) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<GroceryItemDto>> List(CancellationToken ct) => await grocery.ListAsync(ct);

    [HttpPost]
    public async Task<GroceryItemDto> Create(SaveGroceryItemRequest request, CancellationToken ct) =>
        await grocery.CreateAsync(request, ct);

    [HttpPatch("{id:guid}/checked")]
    public async Task<ActionResult<GroceryItemDto>> SetChecked(Guid id, SetGroceryItemCheckedRequest request, CancellationToken ct) =>
        await grocery.SetCheckedAsync(id, request.IsChecked, ct) is { } item ? Ok(item) : NotFound();

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        await grocery.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
