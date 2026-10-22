using Gurtundaa.Application.Providers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/provider-customers")]
public class ProviderCustomersController(IProviderCustomersService customers) : ControllerBase
{
    [Authorize(Roles = "MilkProvider,LaundryProvider")]
    [HttpGet]
    public async Task<IReadOnlyList<ProviderManualCustomerDto>> List(CancellationToken ct) => await customers.ListAsync(ct);

    [Authorize(Roles = "MilkProvider,LaundryProvider")]
    [HttpPost]
    public async Task<ActionResult<ProviderManualCustomerDto>> Create(SaveProviderManualCustomerRequest request, CancellationToken ct) =>
        Ok(await customers.CreateAsync(request, ct));

    [Authorize(Roles = "MilkProvider,LaundryProvider")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProviderManualCustomerDto>> Update(Guid id, SaveProviderManualCustomerRequest request, CancellationToken ct) =>
        await customers.UpdateAsync(id, request, ct) is { } customer ? Ok(customer) : NotFound();

    [Authorize(Roles = "MilkProvider,LaundryProvider")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct) =>
        await customers.ArchiveAsync(id, ct) ? NoContent() : NotFound();

    [Authorize(Roles = "MilkProvider,LaundryProvider")]
    [HttpPost("{id:guid}/link-code")]
    public async Task<ActionResult<ProviderManualCustomerDto>> GenerateLinkCode(Guid id, CancellationToken ct) =>
        await customers.GenerateLinkCodeAsync(id, ct) is { } customer ? Ok(customer) : NotFound();

    [HttpPost("claim")]
    public async Task<ActionResult<ProviderManualCustomerDto>> Claim(ClaimProviderCustomerRequest request, CancellationToken ct)
    {
        var result = await customers.ClaimAsync(request, ct);
        return result.Succeeded ? Ok(result.Value) : Problem(title: string.Join(" ", result.Errors), statusCode: StatusCodes.Status400BadRequest);
    }
}
