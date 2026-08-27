using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Notifications.Specifications;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Notifications.Queries;

public sealed record GetNotificationsQuery(bool UnreadOnly, int Take) : IQuery<Result<NotificationListDto>>;

public sealed class GetNotificationsQueryHandler : IQueryHandler<GetNotificationsQuery, NotificationListDto>
{
    private readonly INotificationRepository _notifications;
    private readonly ICurrentUser _currentUser;

    public GetNotificationsQueryHandler(INotificationRepository notifications, ICurrentUser currentUser)
    {
        _notifications = notifications;
        _currentUser = currentUser;
    }

    public async Task<Result<NotificationListDto>> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId)
            return Error.Unauthorized("User.Unauthenticated", "Not authenticated.");

        var take = Math.Clamp(request.Take, 1, 200);

        var unread = await _notifications.CountAsync(new UnreadNotificationsSpecification(userId), cancellationToken);
        var items = await _notifications.ListAsync(new UserNotificationsSpecification(userId, request.UnreadOnly, take), cancellationToken);

        var dtos = items
            .Select(n => new NotificationDto(n.Id, (int)n.Type, n.Title, n.Message, n.Link, n.IsRead, n.CreatedAt))
            .ToList();

        return new NotificationListDto(unread, dtos);
    }
}
