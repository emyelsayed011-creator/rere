using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Notifications.Specifications;

/// <summary>Fetches a single notification owned by the given user (prevents cross-user access).</summary>
public sealed class NotificationByIdSpecification : Specification<Notification>
{
    public NotificationByIdSpecification(long id, string userId)
    {
        Where(n => n.Id == id && n.UserId == userId);
    }
}
