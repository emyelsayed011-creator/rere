using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.Features.Notifications.Specifications;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Notifications.Commands;

public sealed record MarkNotificationReadCommand(long Id) : ICommand;

public sealed class MarkNotificationReadCommandHandler : ICommandHandler<MarkNotificationReadCommand>
{
    private readonly INotificationRepository _notifications;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;

    public MarkNotificationReadCommandHandler(INotificationRepository notifications, IUnitOfWork unitOfWork, ICurrentUser currentUser)
    {
        _notifications = notifications;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(MarkNotificationReadCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId)
            return Error.Unauthorized("User.Unauthenticated", "Not authenticated.");

        var notification = await _notifications.FirstOrDefaultAsync(new NotificationByIdSpecification(request.Id, userId), cancellationToken);
        if (notification is null)
            return Error.NotFound("Notification.NotFound", $"Notification {request.Id} was not found.");

        notification.IsRead = true;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
