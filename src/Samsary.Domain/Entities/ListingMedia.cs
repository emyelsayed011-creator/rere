using Samsary.Domain.Enums;

namespace Samsary.Domain.Entities;

public class ListingMedia
{
    public int Id { get; set; }
    public int ListingId { get; set; }
    public Listing? Listing { get; set; }

    public string Url { get; set; } = string.Empty;
    public string PublicId { get; set; } = string.Empty;
    public MediaType MediaType { get; set; }
    public double? DurationSeconds { get; set; }
    public string? ThumbnailUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
