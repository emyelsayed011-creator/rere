namespace Samsary.Domain.Entities;

/// <summary>
/// Records a user's explicit consent to the Terms of Service, Privacy Policy and cookie categories.
/// For logged-in users, keyed by UserId. For anonymous visitors, keyed by SessionId cookie.
/// </summary>
public class UserConsent
{
    public long Id { get; set; }

    /// <summary>Null for anonymous visitors (use <see cref="SessionId"/> instead).</summary>
    public string? UserId { get; set; }
    public ApplicationUser? User { get; set; }

    /// <summary>Browser session identifier for anonymous consent tracking.</summary>
    public string SessionId { get; set; } = string.Empty;

    // ── Consent categories (Necessary is always true and never togglable) ──
    public bool NecessaryConsent { get; set; } = true;
    public bool AnalyticsConsent { get; set; }
    public bool MarketingConsent { get; set; }

    /// <summary>Whether the user explicitly accepted the Terms of Service.</summary>
    public bool TermsAccepted { get; set; }

    /// <summary>Version of the terms the user accepted, e.g. "1.0".</summary>
    public string TermsVersion { get; set; } = string.Empty;

    /// <summary>Whether the user accepted the Privacy Policy.</summary>
    public bool PrivacyPolicyAccepted { get; set; }

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime AcceptedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
