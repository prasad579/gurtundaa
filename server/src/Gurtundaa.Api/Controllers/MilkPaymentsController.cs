using Gurtundaa.Application.Milk;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/milk/payments")]
public class MilkPaymentsController(IMilkPaymentService payments) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<MilkPaymentDto>> List([FromQuery] int year, [FromQuery] int month, CancellationToken ct) =>
        await payments.ListForMonthAsync(year, month, ct);

    [HttpPost]
    public async Task<ActionResult<MilkPaymentDto>> Create(SaveMilkPaymentRequest request, CancellationToken ct) =>
        Ok(await payments.CreateAsync(request, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        await payments.DeleteAsync(id, ct) ? NoContent() : NotFound();

    [HttpGet("~/api/milk/provider-payment-info")]
    public async Task<MilkProviderPaymentInfoDto> GetProviderPaymentInfo(CancellationToken ct) =>
        await payments.GetProviderPaymentInfoAsync(ct);

    [HttpPost("upi")]
    public async Task<MilkPaymentDto> InitiateUpi(InitiateUpiPaymentRequest request, CancellationToken ct) =>
        await payments.InitiateUpiAsync(request, ct);
}
