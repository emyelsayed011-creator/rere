using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Samsary.Api.Data;
using Samsary.Api.DTOs;
using Samsary.Api.Models;

namespace Samsary.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ApplicationDbContext _db;
    private readonly INotificationServiceTrigger _trigger;

    public ChatHub(ApplicationDbContext db, INotificationServiceTrigger trigger)
    {
        _db = db;
        _trigger = trigger;
    }

    public async Task SendMessage(string receiverId, string body, int? relatedListingId)
    {
        var senderId = Context.UserIdentifier!;
        if (string.IsNullOrWhiteSpace(body) || body.Length > 2000) return;

        var msg = new ChatMessage
        {
            SenderId = senderId,
            ReceiverId = receiverId,
            Body = body.Trim(),
            RelatedListingId = relatedListingId
        };
        _db.ChatMessages.Add(msg);
        await _db.SaveChangesAsync();

        var sender = await _db.Users.FindAsync(senderId);
        var dto = new ChatMessageDto(msg.Id, senderId,
            sender?.DisplayName ?? sender?.UserName ?? "",
            receiverId, msg.Body, msg.SentAt, msg.IsRead, msg.RelatedListingId);

        await Clients.User(receiverId).SendAsync("receiveMessage", dto);
        await Clients.User(senderId).SendAsync("messageSent", dto);

        await _trigger.NewMessageAsync(senderId, receiverId, msg.Body);
    }

    public async Task MarkRead(long messageId)
    {
        var userId = Context.UserIdentifier!;
        var msg = await _db.ChatMessages.FindAsync(messageId);
        if (msg is null || msg.ReceiverId != userId) return;
        msg.IsRead = true;
        await _db.SaveChangesAsync();
        await Clients.User(msg.SenderId).SendAsync("messageRead", messageId);
    }
}

public interface INotificationServiceTrigger
{
    Task NewMessageAsync(string senderId, string receiverId, string preview);
}
