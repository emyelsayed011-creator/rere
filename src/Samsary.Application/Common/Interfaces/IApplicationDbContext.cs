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
    DbSet<Advertisement> Advertisements { get; }
    DbSet<Review> Reviews { get; }
    DbSet<UserBan> UserBans { get; }
    DbSet<ModeratorProfile> ModeratorProfiles { get; }
    DbSet<UserNotificationPreferences> NotificationPreferences { get; }
    DbSet<ListingAlert> ListingAlerts { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
