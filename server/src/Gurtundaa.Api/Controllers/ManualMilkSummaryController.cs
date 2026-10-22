using Gurtundaa.Application.Providers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize(Roles = "MilkProvider")]
[Route("api/provider-customers/milk-summary")]
public class ManualMilkSummaryController(IManualMilkService milk) : ControllerBase
{
    [HttpGet("month")]
    public async Task<IReadOnlyList<ManualMilkDaySummaryDto>> GetMonth([FromQuery] int year, [FromQuery] int month, CancellationToken ct) =>
        await milk.GetProviderMonthSummaryAsync(year, month, ct);

    [HttpGet("day")]
    public async Task<IReadOnlyList<ManualMilkDayCustomerDto>> GetDay([FromQuery] DateOnly date, CancellationToken ct) =>
        await milk.GetDayDetailAsync(date, ct);
}
