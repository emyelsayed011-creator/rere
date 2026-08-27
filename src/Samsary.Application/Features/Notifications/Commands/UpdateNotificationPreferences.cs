using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Notifications.Commands;

public sealed record UpdateNotificationPreferencesCommand(
    bool EmailEnabled,
    bool SmsEnabled,
    bool WebPushEnabled,
    bool NotifyOnNewMessage,
    bool NotifyOnListingAlert,
    bool NotifyOnListingStatus,
    int MessageEmailDelayMinutes,
    bool ListingAlertDigest,
    int MaxListingAlertsPerDay,
    bool QuietHoursEnabled,
    int QuietHoursStartUtc,
    int QuietHoursEndUtc) : ICommand<Result<NotificationPreferencesDto>>;

public sealed class UpdateNotificationPreferencesCommandHandler
    : ICommandHandler<UpdateNotificationPreferencesCommand, NotificationPreferencesDto>
{
    private readonly IUserNotificationPreferencesRepository _prefs;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _uow;

    public UpdateNotificationPreferencesCommandHandler(
        IUserNotificationPreferencesRepository prefs, ICurrentUser currentUser, IUnitOfWork uow)
    {
        _prefs = prefs;
        _currentUser = currentUser;
        _uow = uow;
    }

    public async Task<Result<NotificationPreferencesDto>> Handle(
        UpdateNotificationPreferencesCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserIdRequired;
        var prefs = await _prefs.GetByUserIdAsync(userId, cancellationToken);

        if (prefs is null)
        {
            prefs = new UserNotificationPreferences { UserId = userId };
            _prefs.Add(prefs);
        }

        prefs.EmailEnabled = request.EmailEnabled;
        prefs.SmsEnabled = request.SmsEnabled;
        prefs.WebPushEnabled = request.WebPushEnabled;
        prefs.NotifyOnNewMessage = request.NotifyOnNewMessage;
        prefs.NotifyOnListingAlert = request.NotifyOnListingAlert;
        prefs.NotifyOnListingStatus = request.NotifyOnListingStatus;
        prefs.MessageEmailDelayMinutes = Math.Clamp(request.MessageEmailDelayMinutes, 0, 1440);
        prefs.ListingAlertDigest = request.ListingAlertDigest;
        prefs.MaxListingAlertsPerDay = Math.Clamp(request.MaxListingAlertsPerDay, 1, 50);
        prefs.QuietHoursEnabled = request.QuietHoursEnabled;
        prefs.QuietHoursStartUtc = Math.Clamp(request.QuietHoursStartUtc, 0, 23);
        prefs.QuietHoursEndUtc = Math.Clamp(request.QuietHoursEndUtc, 0, 23);
        prefs.UpdatedAt = DateTime.UtcNow;

        await _uow.SaveChangesAsync(cancellationToken);
        return ToDto(prefs);
    }

    internal static NotificationPreferencesDto ToDto(UserNotificationPreferences p) => new(
        p.EmailEnabled, p.SmsEnabled, p.WebPushEnabled,
        p.NotifyOnNewMessage, p.NotifyOnListingAlert, p.NotifyOnListingStatus,
        p.MessageEmailDelayMinutes, p.ListingAlertDigest, p.MaxListingAlertsPerDay,
        p.QuietHoursEnabled, p.QuietHoursStartUtc, p.QuietHoursEndUtc);
}
