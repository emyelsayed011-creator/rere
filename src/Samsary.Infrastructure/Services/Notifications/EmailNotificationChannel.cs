using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Samsary.Application.Common.Interfaces;
using Samsary.Domain.Enums;
using Samsary.Infrastructure.Configuration;

namespace Samsary.Infrastructure.Services.Notifications;

/// <summary>Observer that emails the notification to the user. Failures are logged, never thrown.</summary>
public sealed class EmailNotificationChannel : INotificationChannel
{
    private readonly IApplicationDbContext _db;
    private readonly IEmailService _email;
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailNotificationChannel> _logger;

    public EmailNotificationChannel(
        IApplicationDbContext db, IEmailService email,
        IOptions<EmailSettings> settings, ILogger<EmailNotificationChannel> logger)
    {
        _db = db;
        _email = email;
        _settings = settings.Value;
        _logger = logger;
    }

    public NotificationChannel Channel => NotificationChannel.Email;

    public async Task SendAsync(NotificationMessage message, CancellationToken cancellationToken = default)
    {
        var user = await _db.Users.FindAsync([message.UserId], cancellationToken);
        if (user?.Email is not { } toEmail) return;

        try
        {
            string html;
            if (message.EmailHtml is not null)
            {
                // Custom HTML was provided (e.g. from NotificationHandlers) — still wrap in template
                html = EmailTemplate.Notification(
                    _settings.FromName, _settings.AppBaseUrl, "#1a4f7a",
                    message.Title, message.Body,
                    ctaLabel: "عرض الإشعار", ctaPath: message.Link ?? "/notifications");
                // Embed the custom body inside the template body slot
                html = html.Replace(message.Body, message.EmailHtml);
            }
            else
            {
                html = EmailTemplate.Notification(
                    _settings.FromName, _settings.AppBaseUrl, "#1a4f7a",
                    message.Title, message.Body,
                    ctaLabel: "عرض الإشعار", ctaPath: message.Link ?? "/notifications");
            }

            await _email.SendAsync(toEmail, $"{_settings.FromName} — {message.Title}", html, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Email notify failed for {UserId}", message.UserId);
        }
    }
}
