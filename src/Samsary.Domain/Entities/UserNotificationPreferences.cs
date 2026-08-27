namespace Samsary.Domain.Entities;

/// <summary>Per-user preferences for which channels and event types generate notifications.</summary>
public class UserNotificationPreferences
{
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    // ── Channel opt-in/opt-out ──────────────────────────────────────────────
    public bool EmailEnabled { get; set; } = true;
    public bool SmsEnabled { get; set; } = false;
    public bool WebPushEnabled { get; set; } = true;

    // ── Event type preferences ──────────────────────────────────────────────
    public bool NotifyOnNewMessage { get; set; } = true;
    public bool NotifyOnListingAlert { get; set; } = true;
    public bool NotifyOnListingStatus { get; set; } = true;

    // ── Anti-spam rules ─────────────────────────────────────────────────────
    /// <summary>Minutes of inactivity before a chat message triggers an email. 0 = immediate.</summary>
    public int MessageEmailDelayMinutes { get; set; } = 15;

    /// <summary>Batch listing-alert emails into a daily digest instead of per-listing.</summary>
    public bool ListingAlertDigest { get; set; } = true;

    /// <summary>Maximum number of listing-alert notifications per day across all subscriptions.</summary>
    public int MaxListingAlertsPerDay { get; set; } = 10;

    // ── Quiet hours (local time on client, stored as UTC offset hours) ──────
    public bool QuietHoursEnabled { get; set; } = false;

    /// <summary>Hour 0–23 UTC when quiet period starts.</summary>
    public int QuietHoursStartUtc { get; set; } = 22;

    /// <summary>Hour 0–23 UTC when quiet period ends.</summary>
    public int QuietHoursEndUtc { get; set; } = 7;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
