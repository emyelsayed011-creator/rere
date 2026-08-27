using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Domain.Entities;
using Samsary.Domain.Enums;
using Wolverine;

namespace Samsary.Infrastructure.Services.Notifications;

/// <summary>
/// Wolverine handlers (Observer subscribers) for notification events. They replace the former
/// Hangfire jobs; durability/retries/scheduling are provided by Wolverine's Postgres outbox.
/// </summary>
public class NotificationHandlers
{
    /// <summary>
    /// On a new chat message: send the in-app notification immediately, then schedule a delayed
    /// email that only fires if the message is still unread (respects per-user preferences).
    /// </summary>
    public async Task Handle(
        NewMessageEvent e,
        IApplicationDbContext db,
        INotificationService notif,
        IMessageBus bus)
    {
        var sender = await db.Users.FindAsync(e.SenderId);
        var name = sender?.DisplayName ?? sender?.UserName ?? "Someone";
        var truncated = e.Preview.Length > 80 ? e.Preview[..80] + "…" : e.Preview;

        await notif.NotifyAsync(e.ReceiverId, NotificationType.NewMessage,
            $"New message from {name}", truncated, $"/chat/{e.SenderId}", NotificationChannel.InApp);

        var prefs = await db.NotificationPreferences.FirstOrDefaultAsync(p => p.UserId == e.ReceiverId);
        bool emailEnabled = prefs?.EmailEnabled ?? true;
        bool notifyOnMsg = prefs?.NotifyOnNewMessage ?? true;
        int delayMinutes = prefs?.MessageEmailDelayMinutes ?? 15;

        if (emailEnabled && notifyOnMsg && !IsQuietHours(prefs))
        {
            await bus.ScheduleAsync(
                new MessageEmailReminder(e.SenderId, e.ReceiverId, name, truncated),
                TimeSpan.FromMinutes(delayMinutes > 0 ? delayMinutes : 1));
        }
    }

    /// <summary>Sends the message email only if the conversation still has unread messages.</summary>
    public async Task Handle(
        MessageEmailReminder e,
        IApplicationDbContext db,
        INotificationService notif,
        ILogger<NotificationHandlers> logger)
    {
        var hasUnread = await db.ChatMessages.AnyAsync(m =>
            m.SenderId == e.SenderId && m.ReceiverId == e.ReceiverId && !m.IsRead);

        if (!hasUnread)
        {
            logger.LogDebug("Skipping message email: messages already read (sender={SenderId})", e.SenderId);
            return;
        }

        await notif.NotifyAsync(e.ReceiverId, NotificationType.NewMessage,
            $"New message from {e.SenderName}", e.Preview, $"/chat/{e.SenderId}",
            NotificationChannel.Email,
            $"<p>You have an unread message from <strong>{e.SenderName}</strong>:</p><blockquote>{e.Preview}</blockquote><p><a href=\"/chat/{e.SenderId}\">Reply now</a></p>");
    }

    /// <summary>Fans out a newly approved listing to all matching, active alert subscribers.</summary>
    public async Task Handle(
        ListingApprovedEvent e,
        IApplicationDbContext db,
        INotificationService notif,
        ILogger<NotificationHandlers> logger)
    {
        var listing = await db.Listings
            .Include(l => l.Category)
            .FirstOrDefaultAsync(l => l.Id == e.ListingId);

        if (listing is null)
        {
            logger.LogWarning("ListingApprovedEvent: listing {ListingId} not found", e.ListingId);
            return;
        }

        var categoryId = listing.CategoryId;
        var location = listing.Location;
        var today = DateTime.UtcNow.Date;

        var matchingAlerts = await db.ListingAlerts
            .Where(a => a.IsActive)
            .Where(a => !a.CategoryId.HasValue || a.CategoryId == categoryId)
            .Where(a => a.Location == null ||
                        (location != null && EF.Functions.ILike(location, $"%{a.Location}%")))
            .ToListAsync();

        foreach (var alert in matchingAlerts)
        {
            if (alert.UserId == listing.OwnerId) continue;

            if (alert.LastCountResetAt?.Date != today)
            {
                alert.DailyTriggerCount = 0;
                alert.LastCountResetAt = DateTime.UtcNow;
            }

            var prefs = await db.NotificationPreferences.FirstOrDefaultAsync(p => p.UserId == alert.UserId);
            int maxPerDay = prefs?.MaxListingAlertsPerDay ?? 10;
            bool alertEnabled = prefs?.NotifyOnListingAlert ?? true;
            bool emailEnabled = prefs?.EmailEnabled ?? true;
            bool digest = prefs?.ListingAlertDigest ?? true;
            bool quietNow = IsQuietHours(prefs);

            if (!alertEnabled) continue;
            if (alert.DailyTriggerCount >= maxPerDay) continue;

            await notif.NotifyAsync(alert.UserId, NotificationType.ListingAlert,
                "New listing matching your alert",
                $"{listing.Title} was just posted in {listing.Category?.Name ?? "your saved category"}",
                $"/listings/{listing.Id}", NotificationChannel.InApp);

            if (emailEnabled && !digest && !quietNow)
            {
                await notif.NotifyAsync(alert.UserId, NotificationType.ListingAlert,
                    "New listing matching your alert", listing.Title,
                    $"/listings/{listing.Id}", NotificationChannel.Email,
                    BuildAlertEmailHtml(listing.Title, listing.Id, listing.Category?.Name));
            }

            alert.DailyTriggerCount++;
            alert.LastTriggeredAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        logger.LogInformation("ListingApprovedEvent: dispatched {Count} alerts for listing {ListingId}",
            matchingAlerts.Count, e.ListingId);
    }

    private static string BuildAlertEmailHtml(string title, int id, string? category)
    {
        var cat = category is not null ? $" in <em>{category}</em>" : string.Empty;
        return $"""
            <p>A new listing matching your alert was just approved{cat}:</p>
            <h3><a href="/listings/{id}">{title}</a></h3>
            <p style="font-size:12px;color:#888">
              You received this because you subscribed to listing alerts.
              <a href="/settings/notifications">Manage alerts</a> or
              <a href="/settings/notifications">unsubscribe</a>.
            </p>
            """;
    }

    private static bool IsQuietHours(UserNotificationPreferences? prefs)
    {
        if (prefs is null || !prefs.QuietHoursEnabled) return false;
        var nowHour = DateTime.UtcNow.Hour;
        var start = prefs.QuietHoursStartUtc;
        var end = prefs.QuietHoursEndUtc;
        return start > end
            ? nowHour >= start || nowHour < end
            : nowHour >= start && nowHour < end;
    }
}
