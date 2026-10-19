using Gurtundaa.Application.Bills;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/bills")]
public class BillsController(IBillService bills) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<BillDto>> List(CancellationToken ct) => await bills.ListAsync(ct);

    [HttpPost]
    public async Task<ActionResult<BillDto>> Create(SaveBillRequest request, CancellationToken ct)
    {
        var created = await bills.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<BillDto>> Update(Guid id, SaveBillRequest request, CancellationToken ct) =>
        await bills.UpdateAsync(id, request, ct) is { } bill ? Ok(bill) : NotFound();

    [HttpPatch("{id:guid}/paid")]
    public async Task<ActionResult<BillDto>> SetPaid(Guid id, SetBillPaidRequest request, CancellationToken ct) =>
        await bills.SetPaidAsync(id, request, ct) is { } bill ? Ok(bill) : NotFound();

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        await bills.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
