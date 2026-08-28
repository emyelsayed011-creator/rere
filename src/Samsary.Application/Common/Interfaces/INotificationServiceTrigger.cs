namespace Samsary.Application.Common.Interfaces;

public interface INotificationServiceTrigger
{
    Task NewMessageAsync(string senderId, string receiverId, string preview);
}
