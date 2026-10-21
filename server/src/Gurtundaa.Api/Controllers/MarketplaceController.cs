using Gurtundaa.Application.Marketplace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize(Roles = "Customer")]
[Route("api/marketplace")]
public class MarketplaceController(IQuotationRequestService requests) : ControllerBase
{
    [HttpPost("requests")]
    public async Task<ActionResult<QuotationRequestDto>> Submit(SubmitQuotationRequest request, CancellationToken ct)
    {
        var created = await requests.SubmitAsync(request, ct);
        return CreatedAtAction(nameof(GetDetail), new { id = created.Id }, created);
    }

    [HttpGet("requests")]
    public async Task<IReadOnlyList<QuotationRequestDto>> List(CancellationToken ct) => await requests.ListAsync(ct);

    [HttpGet("requests/{id:guid}")]
    public async Task<ActionResult<QuotationRequestDetailDto>> GetDetail(Guid id, CancellationToken ct) =>
        await requests.GetDetailAsync(id, ct) is { } detail ? Ok(detail) : NotFound();

    [HttpPost("requests/{id:guid}/accept")]
    public async Task<ActionResult<QuotationRequestDetailDto>> Accept(Guid id, AcceptQuoteRequest request, CancellationToken ct) =>
        await requests.AcceptAsync(id, request, ct) is { } detail ? Ok(detail) : NotFound();

    [HttpGet("shops")]
    public async Task<IReadOnlyList<ShopSummaryDto>> ListShops(CancellationToken ct) => await requests.ListShopsAsync(ct);
}
