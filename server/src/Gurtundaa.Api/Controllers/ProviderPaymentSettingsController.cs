using Gurtundaa.Application.Providers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize(Roles = "MilkProvider,LaundryProvider")]
[Route("api/provider/payment-settings")]
public class ProviderPaymentSettingsController(IProviderPaymentSettingsService settings) : ControllerBase
{
    [HttpGet]
    public async Task<ProviderPaymentSettingsDto> Get(CancellationToken ct) => await settings.GetAsync(ct);

    [HttpPut]
    public async Task<ProviderPaymentSettingsDto> Save(SaveProviderPaymentSettingsRequest request, CancellationToken ct) =>
        await settings.SaveAsync(request, ct);
}
