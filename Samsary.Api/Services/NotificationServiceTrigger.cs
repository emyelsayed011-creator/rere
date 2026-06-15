using Microsoft.EntityFrameworkCore;
using Samsary.Api.Data;
using Samsary.Api.Hubs;
using Samsary.Api.Models;
using Samsary.Api.Services;

namespace Samsary.Api.Services;

public class NotificationServiceTrigger : INotificationServiceTrigger
{
    private readonly IServiceScopeFactory _scopeFactory;

    public NotificationServiceTrigger(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public async Task NewMessageAsync(string senderId, string receiverId, string preview)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var notif = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var sender = await db.Users.FindAsync(senderId);
        var name = sender?.DisplayName ?? sender?.UserName ?? "Someone";
        var truncated = preview.Length > 80 ? preview[..80] + "…" : preview;
        await notif.NotifyAsync(receiverId, NotificationType.NewMessage,
            $"New message from {name}", truncated, $"/chat/{senderId}",
            NotificationChannel.InApp);
    }
}
