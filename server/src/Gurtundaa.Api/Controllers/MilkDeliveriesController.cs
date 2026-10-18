using Gurtundaa.Application.Milk;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/milk/deliveries")]
public class MilkDeliveriesController(IMilkDeliveryService deliveries) : ControllerBase
{
    [HttpGet]
    public async Task<MilkMonthDto> GetMonth([FromQuery] int year, [FromQuery] int month, CancellationToken ct) =>
        await deliveries.GetMonthAsync(year, month, ct);

    [HttpGet("today")]
    public async Task<MilkTodayDto> GetToday(CancellationToken ct) => await deliveries.GetTodayAsync(ct);

    [HttpPatch("{date}")]
    public async Task<MilkTodayDto> SetOverride(DateOnly date, SetMilkDeliveryOverrideRequest request, CancellationToken ct) =>
        await deliveries.SetOverrideAsync(date, request, ct);
}
