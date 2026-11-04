namespace Gurtundaa.Application.Assistant;

public interface IAssistantService
{
    Task<AssistantReplyDto> ProcessAsync(AssistantCommandRequest request, CancellationToken ct);
}
