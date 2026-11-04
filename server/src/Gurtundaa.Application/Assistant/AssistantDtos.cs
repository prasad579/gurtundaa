using System.ComponentModel.DataAnnotations;

namespace Gurtundaa.Application.Assistant;

public sealed record AssistantCommandRequest([Required, MaxLength(500)] string Text);

/// <summary>`Understood = false` means nothing matched and `Reply` is a "try rephrasing" hint, not a confirmation of an action taken.</summary>
public sealed record AssistantReplyDto(string Reply, bool Understood);
