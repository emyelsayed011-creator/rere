using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Samsary.Application.Features.Chat.Queries;

namespace Samsary.Api.Controllers;

[Authorize]
[Route("api/chat")]
public class ChatController : ApiControllerBase
{
    private readonly ISender _sender;

    public ChatController(ISender sender) => _sender = sender;

    [HttpGet("conversations")]
    public async Task<IActionResult> Conversations(CancellationToken ct)
        => HandleResult(await _sender.Send(new GetConversationsQuery(), ct));

    [HttpGet("with/{otherId}")]
    public async Task<IActionResult> Thread(
        string otherId, [FromQuery] int take = 100, CancellationToken ct = default)
        => HandleResult(await _sender.Send(new GetChatThreadQuery(otherId, take), ct));
}
