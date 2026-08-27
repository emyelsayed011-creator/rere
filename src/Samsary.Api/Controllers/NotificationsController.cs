using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Samsary.Application.Features.Notifications.Commands;
using Samsary.Application.Features.Notifications.Queries;

namespace Samsary.Api.Controllers;

[Authorize]
[Route("api/notifications")]
public class NotificationsController : ApiControllerBase
{
    private readonly ISender _sender;

    public NotificationsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] bool unreadOnly = false, [FromQuery] int take = 50, CancellationToken ct = default)
        => HandleResult(await _sender.Send(new GetNotificationsQuery(unreadOnly, take), ct));

    [HttpPost("{id:long}/read")]
    public async Task<IActionResult> Read(long id, CancellationToken ct)
        => HandleResult(await _sender.Send(new MarkNotificationReadCommand(id), ct));

    [HttpPost("read-all")]
    public async Task<IActionResult> ReadAll(CancellationToken ct)
        => HandleResult(await _sender.Send(new MarkAllNotificationsReadCommand(), ct));
}
