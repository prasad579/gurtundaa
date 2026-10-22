using Gurtundaa.Application.Milk;
using Gurtundaa.Application.Providers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize(Roles = "MilkProvider")]
[Route("api/provider-customers/{providerCustomerId:guid}/milk-entries")]
public class ManualMilkController(IManualMilkService milk) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<ManualMilkEntryDto>> List(Guid providerCustomerId, [FromQuery] int take, CancellationToken ct) =>
        await milk.ListAsync(providerCustomerId, take <= 0 ? 30 : take, ct);

    [HttpGet("month")]
    public async Task<ActionResult<MilkMonthDto>> GetMonth(Guid providerCustomerId, [FromQuery] int year, [FromQuery] int month, CancellationToken ct) =>
        await milk.GetMonthAsync(providerCustomerId, year, month, ct) is { } result ? Ok(result) : NotFound();

    [HttpPut]
    public async Task<ActionResult<ManualMilkEntryDto>> Upsert(Guid providerCustomerId, SaveManualMilkEntryRequest request, CancellationToken ct) =>
        await milk.UpsertAsync(providerCustomerId, request, ct) is { } entry ? Ok(entry) : NotFound();

    [HttpPost("extra")]
    public async Task<ActionResult<ManualMilkEntryDto>> AddExtra(Guid providerCustomerId, AddManualMilkExtraRequest request, CancellationToken ct) =>
        await milk.AddExtraAsync(providerCustomerId, request, ct) is { } entry ? Ok(entry) : NotFound();

    [HttpPost("return")]
    public async Task<ActionResult<ManualMilkEntryDto>> AddReturn(Guid providerCustomerId, AddManualMilkReturnRequest request, CancellationToken ct) =>
        await milk.AddReturnAsync(providerCustomerId, request, ct) is { } entry ? Ok(entry) : NotFound();

    [HttpPatch("{entryId:guid}/paid")]
    public async Task<ActionResult<ManualMilkEntryDto>> SetPaid(Guid entryId, SetManualMilkPaidRequest request, CancellationToken ct) =>
        await milk.SetPaidAsync(entryId, request, ct) is { } entry ? Ok(entry) : NotFound();

    [HttpDelete("{entryId:guid}")]
    public async Task<IActionResult> Delete(Guid entryId, CancellationToken ct) =>
        await milk.DeleteAsync(entryId, ct) ? NoContent() : NotFound();
}
