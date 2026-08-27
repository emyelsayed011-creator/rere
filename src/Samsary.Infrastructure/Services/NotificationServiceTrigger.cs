using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Wolverine;

namespace Samsary.Infrastructure.Services;

/// <summary>
/// Publishes notification events to the Wolverine bus. Messages are stored in the Postgres
/// transactional outbox and delivered to <c>NotificationHandlers</c> with built-in retries —
/// no inline fan-out, no Hangfire. Implements the Observer + Outbox patterns.
/// </summary>
public class NotificationServiceTrigger : INotificationServiceTrigger
{
    private readonly IMessageBus _bus;

    public NotificationServiceTrigger(IMessageBus bus) => _bus = bus;

    public Task NewMessageAsync(string senderId, string receiverId, string preview) =>
        _bus.PublishAsync(new NewMessageEvent(senderId, receiverId, preview)).AsTask();

    public Task ListingApprovedAlertsAsync(int listingId) =>
        _bus.PublishAsync(new ListingApprovedEvent(listingId)).AsTask();
}
