using Microsoft.EntityFrameworkCore;
using Samsary.Domain.Entities;

namespace Samsary.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<ApplicationUser> Users { get; }
    DbSet<Category> Categories { get; }
    DbSet<Listing> Listings { get; }
    DbSet<ListingMedia> ListingMedia { get; }
    DbSet<ChatMessage> ChatMessages { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<SystemLog> SystemLogs { get; }
    DbSet<UserFavorite> UserFavorites { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<ListingAlert> ListingAlerts { get; }
    DbSet<UserNotificationPreferences> NotificationPreferences { get; }
    DbSet<UserConsent> UserConsents { get; }
    DbSet<Advertisement> Advertisements { get; }
    DbSet<Review> Reviews { get; }
    DbSet<UserBan> UserBans { get; }
    DbSet<ModeratorProfile> ModeratorProfiles { get; }
    DbSet<ThemeSettings> ThemeSettings { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
