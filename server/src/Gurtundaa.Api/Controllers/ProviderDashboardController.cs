using Gurtundaa.Application.Milk;
using Gurtundaa.Application.Providers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Route("api/provider")]
public class ProviderDashboardController(IProviderDashboardService dashboard, IProviderMilkActionsService milkActions) : ControllerBase
{
    [Authorize(Roles = "LaundryProvider")]
    [HttpGet("laundry/dashboard")]
    public async Task<ActionResult<ProviderLaundryDashboardDto>> GetLaundryDashboard(CancellationToken ct) =>
        Ok(await dashboard.GetLaundryDashboardAsync(ct));

    [Authorize(Roles = "LaundryProvider")]
    [HttpGet("laundry/customers/{householdUserId:guid}")]
    public async Task<ActionResult<ProviderLaundryCustomerDetailDto>> GetLaundryCustomer(Guid householdUserId, CancellationToken ct) =>
        await dashboard.GetLaundryCustomerAsync(householdUserId, ct) is { } detail ? Ok(detail) : NotFound();

    [Authorize(Roles = "MilkProvider")]
    [HttpGet("milk/dashboard")]
    public async Task<ActionResult<ProviderMilkDashboardDto>> GetMilkDashboard(CancellationToken ct) =>
        Ok(await dashboard.GetMilkDashboardAsync(ct));

    [Authorize(Roles = "MilkProvider")]
    [HttpGet("milk/customers/{householdUserId:guid}")]
    public async Task<ActionResult<ProviderMilkCustomerDetailDto>> GetMilkCustomer(Guid householdUserId, CancellationToken ct) =>
        await dashboard.GetMilkCustomerAsync(householdUserId, ct) is { } detail ? Ok(detail) : NotFound();

    [Authorize(Roles = "MilkProvider")]
    [HttpGet("milk/customers/{householdUserId:guid}/month")]
    public async Task<ActionResult<MilkMonthDto>> GetMilkCustomerMonth(
        Guid householdUserId, [FromQuery] int year, [FromQuery] int month, CancellationToken ct) =>
        await dashboard.GetMilkCustomerMonthAsync(householdUserId, year, month, ct) is { } result ? Ok(result) : NotFound();

    [Authorize(Roles = "MilkProvider")]
    [HttpPatch("milk/customers/{householdUserId:guid}/deliveries/{date}")]
    public async Task<ActionResult<MilkTodayDto>> SetDeliveryOverride(
        Guid householdUserId, DateOnly date, SetMilkDeliveryOverrideRequest request, CancellationToken ct)
    {
        var result = await milkActions.SetDeliveryOverrideAsync(householdUserId, date, request, ct);
        return result.Succeeded ? Ok(result.Value) : Problem(title: string.Join(" ", result.Errors), statusCode: StatusCodes.Status400BadRequest);
    }

    [Authorize(Roles = "MilkProvider")]
    [HttpPost("milk/customers/{householdUserId:guid}/extra-requests")]
    public async Task<ActionResult<MilkExtraRequestDto>> AddExtra(
        Guid householdUserId, SaveMilkExtraRequestRequest request, CancellationToken ct)
    {
        var result = await milkActions.AddExtraAsync(householdUserId, request, ct);
        return result.Succeeded ? Ok(result.Value) : Problem(title: string.Join(" ", result.Errors), statusCode: StatusCodes.Status400BadRequest);
    }

    [Authorize(Roles = "MilkProvider")]
    [HttpGet("milk/payments/pending")]
    public async Task<IReadOnlyList<PendingMilkPaymentDto>> ListPendingPayments(CancellationToken ct) =>
        await milkActions.ListPendingPaymentsAsync(ct);

    [Authorize(Roles = "MilkProvider")]
    [HttpPost("milk/payments/{paymentId:guid}/confirm")]
    public async Task<IActionResult> ConfirmPayment(Guid paymentId, CancellationToken ct) =>
        await milkActions.ConfirmPaymentAsync(paymentId, ct) ? NoContent() : NotFound();

    [Authorize(Roles = "MilkProvider")]
    [HttpPost("milk/payments/{paymentId:guid}/reject")]
    public async Task<IActionResult> RejectPayment(Guid paymentId, CancellationToken ct) =>
        await milkActions.RejectPaymentAsync(paymentId, ct) ? NoContent() : NotFound();
}
