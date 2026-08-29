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

    public BroadcastNotificationCommandHandler(IApplicationDbContext db, INotificationService notif)
    {
        _db = db;
        _notif = notif;
    }

    public async Task<Result> Handle(BroadcastNotificationCommand request, CancellationToken cancellationToken)
    {
        var userIds = await _db.Users
            .Where(u => !u.IsBlocked)
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
