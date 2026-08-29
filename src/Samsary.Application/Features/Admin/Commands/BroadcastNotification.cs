using Microsoft.EntityFrameworkCore;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Domain.Enums;

namespace Samsary.Application.Features.Admin.Commands;

public sealed record BroadcastNotificationCommand(
    string Title,
    string Message,
    bool SendEmail = false)
    : ICommand;

public sealed class BroadcastNotificationCommandHandler : ICommandHandler<BroadcastNotificationCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly INotificationService _notif;
    private readonly ICurrentUser _currentUser;

    public BroadcastNotificationCommandHandler(
        IApplicationDbContext db, INotificationService notif, ICurrentUser currentUser)
    {
        _db = db;
        _notif = notif;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(BroadcastNotificationCommand request, CancellationToken cancellationToken)
    {
        var senderId = _currentUser.UserId;

        // Exclude the admin who is sending the broadcast
        var userIds = await _db.Users
            .Where(u => !u.IsBlocked && u.Id != senderId)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        var channels = request.SendEmail
            ? NotificationChannel.InApp | NotificationChannel.Email
            : NotificationChannel.InApp;

        foreach (var uid in userIds)
        {
            await _notif.NotifyAsync(uid, NotificationType.Admin, request.Title, request.Message,
                null, channels, ct: cancellationToken);
        }

        return Result.Success();
    }
}
