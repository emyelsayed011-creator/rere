using System.ComponentModel.DataAnnotations;
using NpgsqlTypes;
using Samsary.Domain.Enums;

namespace Samsary.Domain.Entities;

public class Listing
{
    public int Id { get; set; }

    [MaxLength(200)] public string Title { get; set; } = string.Empty;
    [MaxLength(4000)] public string Description { get; set; } = string.Empty;

    public decimal Price { get; set; }
    [MaxLength(8)] public string Currency { get; set; } = "USD";
    public ListingType Type { get; set; }
    public ListingStatus Status { get; set; } = ListingStatus.Pending;

    [MaxLength(200)] public string? Location { get; set; }
    [MaxLength(2000)] public string? RejectionReason { get; set; }

    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public string OwnerId { get; set; } = string.Empty;
    public ApplicationUser? Owner { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }

    /// <summary>Total number of times the listing detail page was viewed.</summary>
    public int ViewCount { get; set; }

    /// <summary>Postgres generated tsvector over Title + Description for full-text search (GIN-indexed).</summary>
    public NpgsqlTsVector? SearchVector { get; set; }

    public ICollection<ListingMedia> Media { get; set; } = new List<ListingMedia>();
    public ICollection<UserFavorite> Favorites { get; set; } = new List<UserFavorite>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
