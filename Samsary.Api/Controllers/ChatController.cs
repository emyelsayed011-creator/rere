using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Samsary.Api.Data;
using Samsary.Api.DTOs;

namespace Samsary.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public ChatController(ApplicationDbContext db) => _db = db;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet("conversations")]
    public async Task<IEnumerable<ConversationDto>> Conversations()
    {
        var me = UserId;
        var msgs = await _db.ChatMessages
            .Where(m => m.SenderId == me || m.ReceiverId == me)
            .OrderByDescending(m => m.SentAt)
            .ToListAsync();

        var groups = msgs
            .GroupBy(m => m.SenderId == me ? m.ReceiverId : m.SenderId)
            .Select(g => new { OtherId = g.Key, Last = g.First(), Unread = g.Count(m => m.ReceiverId == me && !m.IsRead) })
            .ToList();

        var otherIds = groups.Select(g => g.OtherId).ToList();
        var users = await _db.Users.Where(u => otherIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id);

        return groups.Select(g =>
        {
            users.TryGetValue(g.OtherId, out var u);
            return new ConversationDto(g.OtherId,
                u?.DisplayName ?? u?.UserName ?? "Unknown",
                u?.AvatarUrl,
                g.Last.Body, g.Last.SentAt, g.Unread);
        });
    }

    [HttpGet("with/{otherId}")]
    public async Task<IEnumerable<ChatMessageDto>> Thread(string otherId, [FromQuery] int take = 100)
    {
        take = Math.Clamp(take, 1, 500);
        var me = UserId;
        var msgs = await _db.ChatMessages
            .Where(m => (m.SenderId == me && m.ReceiverId == otherId) ||
                        (m.SenderId == otherId && m.ReceiverId == me))
            .OrderByDescending(m => m.SentAt).Take(take)
            .Include(m => m.Sender)
            .OrderBy(m => m.SentAt).ToListAsync();

        // mark inbound as read
        foreach (var m in msgs.Where(x => x.ReceiverId == me && !x.IsRead)) m.IsRead = true;
        await _db.SaveChangesAsync();

        return msgs.Select(m => new ChatMessageDto(m.Id, m.SenderId,
            m.Sender?.DisplayName ?? m.Sender?.UserName ?? "", m.ReceiverId,
            m.Body, m.SentAt, m.IsRead, m.RelatedListingId));
    }
}
