using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Wolverine;

namespace Samsary.Infrastructure.Services;

public class NotificationServiceTrigger : INotificationServiceTrigger
{
    private readonly IMessageBus _bus;

    public NotificationServiceTrigger(IMessageBus bus) => _bus = bus;

    public Task NewMessageAsync(string senderId, string receiverId, string preview) =>
        _bus.PublishAsync(new NewMessageEvent(senderId, receiverId, preview)).AsTask();

    public Task ListingApprovedAlertsAsync(int listingId) =>
        _bus.PublishAsync(new ListingApprovedEvent(listingId)).AsTask();
}
