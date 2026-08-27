namespace Samsary.Domain.Entities;

/// <summary>A star-rating + text review left by a user on a listing.</summary>
public class Review
{
    public int Id { get; set; }

    public int ListingId { get; set; }
    public Listing? Listing { get; set; }

    public string AuthorId { get; set; } = string.Empty;
    public ApplicationUser? Author { get; set; }

    /// <summary>1–5 stars.</summary>
    public int Rating { get; set; }

    /// <summary>Review body; up to 1000 chars.</summary>
    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Soft-delete: set by admin when a review violates community rules.</summary>
    public bool IsDeleted { get; set; }
    public string? DeletedByAdminId { get; set; }
    public DateTime? DeletedAt { get; set; }
    public string? DeletionReason { get; set; }
}
