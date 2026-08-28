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

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
