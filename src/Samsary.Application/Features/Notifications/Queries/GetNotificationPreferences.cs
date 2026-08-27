using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Notifications.Queries;

public sealed record GetNotificationPreferencesQuery : IQuery<Result<NotificationPreferencesDto>>;

public sealed class GetNotificationPreferencesQueryHandler
    : IQueryHandler<GetNotificationPreferencesQuery, NotificationPreferencesDto>
{
    private readonly IUserNotificationPreferencesRepository _prefs;
    private readonly ICurrentUser _currentUser;

    public GetNotificationPreferencesQueryHandler(
        IUserNotificationPreferencesRepository prefs, ICurrentUser currentUser)
    {
        _prefs = prefs;
        _currentUser = currentUser;
    }

    public async Task<Result<NotificationPreferencesDto>> Handle(
        GetNotificationPreferencesQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserIdRequired;
        var prefs = await _prefs.GetByUserIdAsync(userId, cancellationToken)
                    ?? new UserNotificationPreferences { UserId = userId };

        return Commands.UpdateNotificationPreferencesCommandHandler.ToDto(prefs);
    }
}
