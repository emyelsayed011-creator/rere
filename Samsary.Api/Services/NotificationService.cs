using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Samsary.Api.Data;
using Samsary.Api.DTOs;
using Samsary.Api.Hubs;
using Samsary.Api.Models;

namespace Samsary.Api.Services;

public interface INotificationService
{
    Task NotifyAsync(string userId, NotificationType type, string title, string message,
        string? link = null, NotificationChannel channels = NotificationChannel.InApp,
        string? emailHtml = null, string? phoneNumber = null, CancellationToken ct = default);
}

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _db;
    private readonly IHubContext<NotificationHub> _hub;
    private readonly IEmailService _email;
    private readonly ISmsService _sms;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        ApplicationDbContext db,
        IHubContext<NotificationHub> hub,
        IEmailService email,
        ISmsService sms,
        ILogger<NotificationService> logger)
    {
        _db = db;
        _hub = hub;
        _email = email;
        _sms = sms;
        _logger = logger;
    }

    public async Task NotifyAsync(string userId, NotificationType type, string title, string message,
        string? link = null,
        NotificationChannel channels = NotificationChannel.InApp,
        string? emailHtml = null, string? phoneNumber = null,
        CancellationToken ct = default)
    {
        var notif = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            Link = link
        };
        _db.Notifications.Add(notif);
        await _db.SaveChangesAsync(ct);

        if (channels.HasFlag(NotificationChannel.InApp))
        {
            await _hub.Clients.User(userId).SendAsync("notify", new NotificationDto(
                notif.Id, (int)notif.Type, notif.Title, notif.Message, notif.Link, notif.IsRead, notif.CreatedAt), ct);
        }

        if (channels.HasFlag(NotificationChannel.Email))
        {
            var user = await _db.Users.FindAsync(new object?[] { userId }, ct);
            if (user?.Email is { } toEmail)
            {
                try { await _email.SendAsync(toEmail, title, emailHtml ?? $"<p>{message}</p>", ct); }
                catch (Exception ex) { _logger.LogWarning(ex, "Email notify failed"); }
            }
        }

        if (channels.HasFlag(NotificationChannel.Sms) && !string.IsNullOrWhiteSpace(phoneNumber))
        {
            try { await _sms.SendAsync(phoneNumber!, $"{title}: {message}", ct); }
            catch (Exception ex) { _logger.LogWarning(ex, "SMS notify failed"); }
        }
    }
}
