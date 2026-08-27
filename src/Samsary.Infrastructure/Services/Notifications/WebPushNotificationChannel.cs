using Microsoft.Extensions.Logging;
using Samsary.Domain.Enums;

namespace Samsary.Infrastructure.Services.Notifications;

/// <summary>
/// Web Push notification channel. Requires VAPID keys to be configured.
/// Currently logs intent; wire up a VAPID/WebPush library here when keys are set.
/// </summary>
public sealed class WebPushNotificationChannel : INotificationChannel
{
    private readonly ILogger<WebPushNotificationChannel> _logger;

    public WebPushNotificationChannel(ILogger<WebPushNotificationChannel> logger)
        => _logger = logger;

    public NotificationChannel Channel => NotificationChannel.WebPush;

    public Task SendAsync(NotificationMessage message, CancellationToken cancellationToken = default)
    {
        // TODO: resolve UserPushSubscription from DB, then call the VAPID-signed POST to the push endpoint.
        _logger.LogInformation("[WebPush] Would push to user {UserId}: {Title}", message.UserId, message.Title);
        return Task.CompletedTask;
    }
}
