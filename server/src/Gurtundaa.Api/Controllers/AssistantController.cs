using Gurtundaa.Application.Assistant;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gurtundaa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/assistant")]
public class AssistantController(IAssistantService assistant) : ControllerBase
{
    [HttpPost("command")]
    public async Task<AssistantReplyDto> Command(AssistantCommandRequest request, CancellationToken ct) =>
        await assistant.ProcessAsync(request, ct);
}
