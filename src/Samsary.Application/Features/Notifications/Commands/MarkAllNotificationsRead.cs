using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.Features.Notifications.Specifications;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Notifications.Commands;

public sealed record MarkAllNotificationsReadCommand : ICommand;

public sealed class MarkAllNotificationsReadCommandHandler : ICommandHandler<MarkAllNotificationsReadCommand>
{
    private readonly INotificationRepository _notifications;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;

    public MarkAllNotificationsReadCommandHandler(INotificationRepository notifications, IUnitOfWork unitOfWork, ICurrentUser currentUser)
    {
        _notifications = notifications;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(MarkAllNotificationsReadCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId)
            return Error.Unauthorized("User.Unauthenticated", "Not authenticated.");

        var unread = await _notifications.ListAsync(new UnreadNotificationsSpecification(userId), cancellationToken);
        foreach (var n in unread) n.IsRead = true;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
