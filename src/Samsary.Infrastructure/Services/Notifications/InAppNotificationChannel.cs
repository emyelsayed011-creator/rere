using Microsoft.AspNetCore.SignalR;
using Samsary.Application.DTOs;
using Samsary.Domain.Enums;
using Samsary.Infrastructure.Hubs;

namespace Samsary.Infrastructure.Services.Notifications;

/// <summary>Observer that pushes the notification to the user in real time over SignalR.</summary>
public sealed class InAppNotificationChannel : INotificationChannel
{
    private readonly IHubContext<NotificationHub> _hub;

    public InAppNotificationChannel(IHubContext<NotificationHub> hub) => _hub = hub;

    public NotificationChannel Channel => NotificationChannel.InApp;

    public Task SendAsync(NotificationMessage message, CancellationToken cancellationToken = default)
    {
        var n = message.Notification;
        return _hub.Clients.User(message.UserId).SendAsync("notify", new NotificationDto(
            n.Id, (int)n.Type, n.Title, n.Message, n.Link, n.IsRead, n.CreatedAt), cancellationToken);
    }
}
