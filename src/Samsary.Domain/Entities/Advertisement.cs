namespace Samsary.Domain.Entities;

/// <summary>
/// A promotional advertisement shown in banners or sidebars on the site.
/// Can optionally be linked to a specific Listing, with audience targeting filters.
/// </summary>
public class Advertisement
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Cloudinary or external image URL. Required when not linked to a listing.</summary>
    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>Destination URL when the ad is clicked. Null = use listing link when available.</summary>
    public string? LinkUrl { get; set; }

    /// <summary>Placement slot: "banner" | "home-hero" | "sidebar".</summary>
    public string Placement { get; set; } = "banner";

    /// <summary>Optional: promote an existing listing. When set, the ad shows listing data.</summary>
    public int? ListingId { get; set; }
    public Listing? Listing { get; set; }

    // ── Targeting ────────────────────────────────────────────────────────────
    /// <summary>"all" shows to everyone; "specific" applies the filters below.</summary>
    public string TargetAudience { get; set; } = "all";

    /// <summary>Comma-separated ISO-3166 country codes, e.g. "SA,US,AE". Null = any country.</summary>
    public string? TargetCountries { get; set; }

    /// <summary>Comma-separated genders: "male", "female", "other". Null = any gender.</summary>
    public string? TargetGenders { get; set; }

    /// <summary>Minimum age (inclusive). Null = no lower limit.</summary>
    public int? TargetMinAge { get; set; }

    /// <summary>Maximum age (inclusive). Null = no upper limit.</summary>
    public int? TargetMaxAge { get; set; }

    /// <summary>Comma-separated location keywords. Ad shown when user location contains any keyword.</summary>
    public string? TargetLocations { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime StartsAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndsAt { get; set; }

    // Lightweight analytics
    public int ImpressionCount { get; set; }
    public int ClickCount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedByUserId { get; set; }
}
