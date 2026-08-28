using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Samsary.Application.DTOs;
using Samsary.Application.Services.Chat;

namespace Samsary.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chat;

    public ChatController(IChatService chat) => _chat = chat;

    [HttpGet("conversations")]
    public async Task<ActionResult<IReadOnlyList<ConversationDto>>> Conversations(CancellationToken ct)
        => Ok(await _chat.GetConversationsAsync(ct));

    [HttpGet("with/{otherId}")]
    public async Task<ActionResult<IReadOnlyList<ChatMessageDto>>> Thread(
        string otherId, [FromQuery] int take = 100, CancellationToken ct = default)
        => Ok(await _chat.GetThreadAsync(otherId, take, ct));
}
