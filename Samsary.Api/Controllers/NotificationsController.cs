using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Samsary.Api.Data;
using Samsary.Api.DTOs;

namespace Samsary.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public NotificationsController(ApplicationDbContext db) => _db = db;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<object> Get([FromQuery] bool unreadOnly = false, [FromQuery] int take = 50)
    {
        take = Math.Clamp(take, 1, 200);
        var q = _db.Notifications.Where(n => n.UserId == UserId);
        if (unreadOnly) q = q.Where(n => !n.IsRead);
        var unread = await _db.Notifications.CountAsync(n => n.UserId == UserId && !n.IsRead);
        var items = await q.OrderByDescending(n => n.CreatedAt).Take(take)
            .Select(n => new NotificationDto(n.Id, (int)n.Type, n.Title, n.Message, n.Link, n.IsRead, n.CreatedAt))
            .ToListAsync();
        return new { unread, items };
    }

    [HttpPost("{id:long}/read")]
    public async Task<IActionResult> Read(long id)
    {
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (n is null) return NotFound();
        n.IsRead = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> ReadAll()
    {
        var list = await _db.Notifications.Where(n => n.UserId == UserId && !n.IsRead).ToListAsync();
        list.ForEach(n => n.IsRead = true);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
