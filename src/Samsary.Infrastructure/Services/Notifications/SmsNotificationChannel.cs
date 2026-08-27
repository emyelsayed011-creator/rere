using Microsoft.Extensions.Logging;
using Samsary.Application.Common.Interfaces;
using Samsary.Domain.Enums;

namespace Samsary.Infrastructure.Services.Notifications;

/// <summary>Observer that sends the notification as an SMS when a phone number is supplied.</summary>
public sealed class SmsNotificationChannel : INotificationChannel
{
    private readonly ISmsService _sms;
    private readonly ILogger<SmsNotificationChannel> _logger;

    public SmsNotificationChannel(ISmsService sms, ILogger<SmsNotificationChannel> logger)
    {
        _sms = sms;
        _logger = logger;
    }

    public NotificationChannel Channel => NotificationChannel.Sms;

    public async Task SendAsync(NotificationMessage message, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(message.PhoneNumber)) return;

        try
        {
            await _sms.SendAsync(message.PhoneNumber!, $"{message.Title}: {message.Body}", cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SMS notify failed for {UserId}", message.UserId);
        }
    }
}
