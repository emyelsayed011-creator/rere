using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Samsary.Application.Common.Interfaces;
using Samsary.Domain.Enums;

namespace Samsary.Infrastructure.Services.Notifications;

/// <summary>Observer that emails the notification to the user. Failures are logged, never thrown.</summary>
public sealed class EmailNotificationChannel : INotificationChannel
{
    private readonly IApplicationDbContext _db;
    private readonly IEmailService _email;
    private readonly ILogger<EmailNotificationChannel> _logger;

    public EmailNotificationChannel(IApplicationDbContext db, IEmailService email, ILogger<EmailNotificationChannel> logger)
    {
        _db = db;
        _email = email;
        _logger = logger;
    }

    public NotificationChannel Channel => NotificationChannel.Email;

    public async Task SendAsync(NotificationMessage message, CancellationToken cancellationToken = default)
    {
        var user = await _db.Users.FindAsync([message.UserId], cancellationToken);
        if (user?.Email is not { } toEmail) return;

        try
        {
            await _email.SendAsync(toEmail, message.Title, message.EmailHtml ?? $"<p>{message.Body}</p>", cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Email notify failed for {UserId}", message.UserId);
        }
    }
}
