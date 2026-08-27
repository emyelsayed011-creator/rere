using Samsary.Domain.Entities;
using Samsary.Domain.Enums;

namespace Samsary.Infrastructure.Services.Notifications;

/// <summary>The payload broadcast to every <see cref="INotificationChannel"/> observer.</summary>
public sealed record NotificationMessage(
    string UserId,
    Notification Notification,
    string Title,
    string Body,
    string? Link,
    string? EmailHtml,
    string? PhoneNumber);

/// <summary>
/// An observer for a single delivery channel (in-app, email, SMS, ...). The dispatcher
/// (<see cref="NotificationService"/>) notifies every registered channel whose <see cref="Channel"/>
/// flag is requested, so adding a new channel means adding a new observer — no branching to edit.
/// </summary>
public interface INotificationChannel
{
    /// <summary>The single channel flag this observer handles.</summary>
    NotificationChannel Channel { get; }

    Task SendAsync(NotificationMessage message, CancellationToken cancellationToken = default);
}
