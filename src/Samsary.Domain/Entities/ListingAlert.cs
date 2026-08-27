namespace Samsary.Domain.Entities;

/// <summary>
/// A user's subscription to receive alerts when a new listing matching
/// their criteria (category and/or location) is approved.
/// </summary>
public class ListingAlert
{
    public long Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    /// <summary>Null = alert on any category.</summary>
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }

    /// <summary>Free-text location filter (case-insensitive substring match). Null = any location.</summary>
    public string? Location { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ── Rate-limit tracking (reset daily) ───────────────────────────────────
    public int DailyTriggerCount { get; set; }
    public DateTime? LastCountResetAt { get; set; }
    public DateTime? LastTriggeredAt { get; set; }
}
