using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Notifications.Specifications;

/// <summary>Returns the most recent <paramref name="take"/> notifications for a user, optionally filtered to unread only.</summary>
public sealed class UserNotificationsSpecification : Specification<Notification>
{
    public UserNotificationsSpecification(string userId, bool unreadOnly, int take)
    {
        Where(n => n.UserId == userId);
        if (unreadOnly) Where(n => !n.IsRead);
        ApplyOrderByDescending(n => n.CreatedAt);
        ApplyPaging(0, take);
    }
}
