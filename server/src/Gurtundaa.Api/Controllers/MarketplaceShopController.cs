using Gurtundaa.Application.Marketplace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize(Roles = "Shop")]
[Route("api/marketplace/shop")]
public class MarketplaceShopController(IQuoteService quotes) : ControllerBase
{
    [HttpGet("requests")]
    public async Task<IReadOnlyList<IncomingQuotationRequestDto>> ListIncoming(CancellationToken ct) =>
        await quotes.ListIncomingAsync(ct);

    [HttpGet("requests/{id:guid}")]
    public async Task<ActionResult<IncomingQuotationRequestDto>> GetIncomingDetail(Guid id, CancellationToken ct) =>
        await quotes.GetIncomingDetailAsync(id, ct) is { } detail ? Ok(detail) : NotFound();

    [HttpPost("requests/{id:guid}/quotes")]
    public async Task<ActionResult<QuoteDto>> SubmitQuote(Guid id, SubmitQuoteRequest request, CancellationToken ct) =>
        await quotes.SubmitAsync(id, request, ct) is { } quote ? Ok(quote) : NotFound();

    [HttpGet("quotes")]
    public async Task<IReadOnlyList<QuoteDto>> ListMine(CancellationToken ct) => await quotes.ListMineAsync(ct);

    [HttpPost("quotes/{id:guid}/pack")]
    public async Task<ActionResult<QuoteDto>> TogglePackedItem(Guid id, TogglePackedItemRequest request, CancellationToken ct) =>
        await quotes.TogglePackedItemAsync(id, request, ct) is { } quote ? Ok(quote) : NotFound();

    [HttpPost("quotes/{id:guid}/status")]
    public async Task<ActionResult<QuoteDto>> AdvanceFulfillment(Guid id, AdvanceFulfillmentRequest request, CancellationToken ct) =>
        await quotes.AdvanceFulfillmentAsync(id, request, ct) is { } quote ? Ok(quote) : NotFound();
}
