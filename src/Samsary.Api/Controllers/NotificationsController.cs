using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Samsary.Application.DTOs;
using Samsary.Application.Services.Notifications;

namespace Samsary.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationQueryService _notifications;

    public NotificationsController(INotificationQueryService notifications) => _notifications = notifications;

    [HttpGet]
    public async Task<ActionResult<NotificationListDto>> Get(
        [FromQuery] bool unreadOnly = false, [FromQuery] int take = 50, CancellationToken ct = default)
        => Ok(await _notifications.GetAsync(unreadOnly, take, ct));

    [HttpPost("{id:long}/read")]
    public async Task<IActionResult> Read(long id, CancellationToken ct)
    {
        await _notifications.MarkReadAsync(id, ct);
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> ReadAll(CancellationToken ct)
    {
        await _notifications.MarkAllReadAsync(ct);
        return NoContent();
    }
}
