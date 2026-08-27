using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Notifications.Specifications;

/// <summary>Counts or fetches all unread notifications for a user (used for the bell badge and real-time push).</summary>
public sealed class UnreadNotificationsSpecification : Specification<Notification>
{
    public UnreadNotificationsSpecification(string userId)
    {
        Where(n => n.UserId == userId && !n.IsRead);
    }
}
