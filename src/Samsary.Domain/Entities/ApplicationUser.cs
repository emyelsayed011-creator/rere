using Microsoft.AspNetCore.Identity;

namespace Samsary.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsBlocked { get; set; }

    /// <summary>UTC expiry of an active suspension. Null = not currently time-banned.</summary>
    public DateTime? BannedUntil { get; set; }

    // Optional demographic fields used for advertisement targeting.
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Country { get; set; }

    public ICollection<Listing> Listings { get; set; } = new List<Listing>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<UserFavorite> Favorites { get; set; } = new List<UserFavorite>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<ListingAlert> ListingAlerts { get; set; } = new List<ListingAlert>();
    public UserNotificationPreferences? NotificationPreferences { get; set; }
}
