namespace Samsary.Domain.Entities;

public class UserFavorite
{
    public long Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }
    public int ListingId { get; set; }
    public Listing? Listing { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
