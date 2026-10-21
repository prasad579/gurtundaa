using Gurtundaa.Application.Health;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/health/medicines")]
public class MedicinesController(IMedicineService medicines) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<MedicineDto>> List(CancellationToken ct) => await medicines.ListAsync(ct);

    [HttpPost]
    public async Task<ActionResult<MedicineDto>> Create(SaveMedicineRequest request, CancellationToken ct)
    {
        var created = await medicines.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<MedicineDto>> Update(Guid id, SaveMedicineRequest request, CancellationToken ct) =>
        await medicines.UpdateAsync(id, request, ct) is { } medicine ? Ok(medicine) : NotFound();

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        await medicines.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
