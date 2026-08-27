using Samsary.Domain.Enums;

namespace Samsary.Application.Common.Interfaces;

public interface INotificationService
{
    Task NotifyAsync(string userId, NotificationType type, string title, string message,
        string? link = null, NotificationChannel channels = NotificationChannel.InApp,
        string? emailHtml = null, string? phoneNumber = null, CancellationToken ct = default);
}
