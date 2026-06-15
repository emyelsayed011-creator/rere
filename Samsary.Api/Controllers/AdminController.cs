using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Samsary.Api.Data;
using Samsary.Api.DTOs;
using Samsary.Api.Models;
using Samsary.Api.Services;

namespace Samsary.Api.Controllers;

[ApiController]
[Authorize(Roles = SeedData.AdminRole)]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly INotificationService _notify;

    public AdminController(ApplicationDbContext db, INotificationService notify)
    {
        _db = db;
        _notify = notify;
    }

    [HttpGet("dashboard")]
    public async Task<object> Dashboard()
    {
        return new
        {
            users = await _db.Users.CountAsync(),
            blockedUsers = await _db.Users.CountAsync(u => u.IsBlocked),
            listings = await _db.Listings.CountAsync(),
            pendingListings = await _db.Listings.CountAsync(l => l.Status == ListingStatus.Pending),
            approvedListings = await _db.Listings.CountAsync(l => l.Status == ListingStatus.Approved),
            rejectedListings = await _db.Listings.CountAsync(l => l.Status == ListingStatus.Rejected),
            chatMessages = await _db.ChatMessages.CountAsync(),
            notifications = await _db.Notifications.CountAsync()
        };
    }

    [HttpGet("listings/pending")]
    public async Task<object> Pending()
    {
        var items = await _db.Listings
            .Include(x => x.Category).Include(x => x.Owner).Include(x => x.Media)
            .Where(x => x.Status == ListingStatus.Pending)
            .OrderBy(x => x.CreatedAt).ToListAsync();
        return items.Select(l => new
        {
            l.Id, l.Title, l.Description, l.Price, l.Currency, l.Type,
            l.Location, l.CreatedAt,
            category = new { l.Category!.Id, l.Category.Name },
            owner = new { l.Owner!.Id, l.Owner.DisplayName, l.Owner.Email },
            media = l.Media.Select(m => new { m.Url, m.MediaType, m.ThumbnailUrl })
        });
    }

    [HttpPost("listings/{id:int}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        var l = await _db.Listings.FindAsync(id);
        if (l is null) return NotFound();
        l.Status = ListingStatus.Approved;
        l.ApprovedAt = DateTime.UtcNow;
        l.RejectionReason = null;
        await _db.SaveChangesAsync();

        await _notify.NotifyAsync(l.OwnerId, NotificationType.ListingApproved,
            "Listing approved", $"Your listing \"{l.Title}\" has been approved and is now public.",
            $"/listings/{l.Id}", NotificationChannel.InApp | NotificationChannel.Email,
            $"<p>Your listing <strong>{l.Title}</strong> is now live.</p>");
        return Ok();
    }

    [HttpPost("listings/{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, RejectListingDto dto)
    {
        var l = await _db.Listings.FindAsync(id);
        if (l is null) return NotFound();
        l.Status = ListingStatus.Rejected;
        l.RejectionReason = dto.Reason;
        await _db.SaveChangesAsync();

        await _notify.NotifyAsync(l.OwnerId, NotificationType.ListingRejected,
            "Listing rejected", $"Your listing \"{l.Title}\" was rejected: {dto.Reason}",
            $"/listings/{l.Id}", NotificationChannel.InApp | NotificationChannel.Email,
            $"<p>Your listing <strong>{l.Title}</strong> was rejected.</p><p>Reason: {dto.Reason}</p>");
        return Ok();
    }

    [HttpGet("users")]
    public async Task<object> Users([FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var total = await _db.Users.CountAsync();
        var items = await _db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(u => new { u.Id, u.Email, u.DisplayName, u.IsBlocked, u.CreatedAt })
            .ToListAsync();
        return new { total, page, pageSize, items };
    }

    [HttpPost("users/{id}/block")]
    public async Task<IActionResult> Block(string id, [FromQuery] bool block = true)
    {
        var u = await _db.Users.FindAsync(id);
        if (u is null) return NotFound();
        u.IsBlocked = block;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("users/{id}/message")]
    public async Task<IActionResult> AdminMessage(string id, [FromBody] SendMessageDto dto)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var msg = new ChatMessage { SenderId = adminId, ReceiverId = id, Body = dto.Body };
        _db.ChatMessages.Add(msg);
        await _db.SaveChangesAsync();

        await _notify.NotifyAsync(id, NotificationType.Admin,
            "Message from admin", dto.Body, $"/chat/{adminId}",
            NotificationChannel.InApp | NotificationChannel.Email,
            $"<p>{dto.Body}</p>");
        return Ok();
    }

    [HttpGet("logs")]
    public async Task<object> Logs([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? level = null)
    {
        pageSize = Math.Clamp(pageSize, 1, 200);
        var q = _db.SystemLogs.AsQueryable();
        if (!string.IsNullOrWhiteSpace(level)) q = q.Where(l => l.Level == level);
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new { total, page, pageSize, items };
    }
}
