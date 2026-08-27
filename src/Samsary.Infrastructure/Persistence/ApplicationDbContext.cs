using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Samsary.Application.Common.Interfaces;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext, IUnitOfWork
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<ListingMedia> ListingMedia => Set<ListingMedia>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<SystemLog> SystemLogs => Set<SystemLog>();
    public DbSet<UserFavorite> UserFavorites => Set<UserFavorite>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<ListingAlert> ListingAlerts => Set<ListingAlert>();
    public DbSet<UserNotificationPreferences> NotificationPreferences => Set<UserNotificationPreferences>();
    public DbSet<UserConsent> UserConsents => Set<UserConsent>();
    public DbSet<Advertisement> Advertisements => Set<Advertisement>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<UserBan> UserBans => Set<UserBan>();
    public DbSet<ModeratorProfile> ModeratorProfiles => Set<ModeratorProfile>();

    DbSet<ApplicationUser> IApplicationDbContext.Users => Users;

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<Category>().HasIndex(c => c.Slug).IsUnique();

        b.Entity<Listing>(e =>
        {
            e.HasOne(x => x.Owner).WithMany(u => u.Listings)
                .HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Category).WithMany(c => c.Listings)
                .HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            e.Property(x => x.Price).HasPrecision(18, 2);
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.Type);
            e.Property(x => x.ViewCount).HasDefaultValue(0);

            // Full-text search: tsvector generated from Title + Description, GIN-indexed.
            e.HasGeneratedTsVectorColumn(x => x.SearchVector, "english", x => new { x.Title, x.Description })
                .HasIndex(x => x.SearchVector).HasMethod("GIN");
        });

        b.Entity<ListingMedia>(e =>
        {
            e.HasOne(x => x.Listing).WithMany(l => l.Media)
                .HasForeignKey(x => x.ListingId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ChatMessage>(e =>
        {
            e.HasOne(x => x.Sender).WithMany()
                .HasForeignKey(x => x.SenderId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Receiver).WithMany()
                .HasForeignKey(x => x.ReceiverId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.SenderId, x.ReceiverId, x.SentAt });
        });

        b.Entity<Notification>(e =>
        {
            e.HasOne(x => x.User).WithMany(u => u.Notifications)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.UserId, x.IsRead });
        });

        b.Entity<SystemLog>(e =>
        {
            e.HasIndex(x => x.CreatedAt);
            e.HasIndex(x => x.Level);
        });

        b.Entity<UserFavorite>(e =>
        {
            e.HasOne(x => x.User).WithMany(u => u.Favorites)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Listing).WithMany(l => l.Favorites)
                .HasForeignKey(x => x.ListingId).OnDelete(DeleteBehavior.Cascade);
            // Prevent duplicate favorites.
            e.HasIndex(x => new { x.UserId, x.ListingId }).IsUnique();
        });

        b.Entity<RefreshToken>(e =>
        {
            e.HasOne(x => x.User).WithMany(u => u.RefreshTokens)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasIndex(x => new { x.UserId, x.IsRevoked });
        });

        b.Entity<ListingAlert>(e =>
        {
            e.HasOne(x => x.User).WithMany(u => u.ListingAlerts)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Category).WithMany()
                .HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.SetNull).IsRequired(false);
            e.HasIndex(x => new { x.UserId, x.IsActive });
            e.Property(x => x.IsActive).HasDefaultValue(true);
        });

        b.Entity<UserNotificationPreferences>(e =>
        {
            // 1-to-1 with ApplicationUser; UserId is both PK and FK.
            e.HasKey(x => x.UserId);
            e.HasOne(x => x.User).WithOne(u => u.NotificationPreferences)
                .HasForeignKey<UserNotificationPreferences>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<UserConsent>(e =>
        {
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull).IsRequired(false);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.SessionId);
            e.Property(x => x.TermsVersion).HasMaxLength(20);
            e.Property(x => x.IpAddress).HasMaxLength(45);
            e.Property(x => x.UserAgent).HasMaxLength(512);
        });

        b.Entity<Advertisement>(e =>
        {
            e.HasIndex(x => new { x.Placement, x.IsActive, x.StartsAt });
            e.Property(x => x.Title).HasMaxLength(100);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
            e.Property(x => x.LinkUrl).HasMaxLength(500);
            e.Property(x => x.Placement).HasMaxLength(20);
            e.Property(x => x.ImpressionCount).HasDefaultValue(0);
            e.Property(x => x.ClickCount).HasDefaultValue(0);
            // Targeting
            e.Property(x => x.TargetAudience).HasMaxLength(10).HasDefaultValue("all");
            e.Property(x => x.TargetCountries).HasMaxLength(200);
            e.Property(x => x.TargetGenders).HasMaxLength(50);
            e.Property(x => x.TargetLocations).HasMaxLength(500);
            // Optional listing FK — SetNull so deleting a listing doesn't delete the ad.
            e.HasOne(x => x.Listing).WithMany()
                .HasForeignKey(x => x.ListingId).OnDelete(DeleteBehavior.SetNull).IsRequired(false);
        });

        b.Entity<ApplicationUser>(e =>
        {
            e.Property(x => x.Gender).HasMaxLength(10);
            e.Property(x => x.Country).HasMaxLength(2);
        });

        b.Entity<Review>(e =>
        {
            e.HasOne(x => x.Listing).WithMany(l => l.Reviews)
                .HasForeignKey(x => x.ListingId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Author).WithMany()
                .HasForeignKey(x => x.AuthorId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.ListingId, x.IsDeleted });
            // One review per user per listing (unique — soft deletes counted separately in code)
            e.HasIndex(x => new { x.ListingId, x.AuthorId });
            e.Property(x => x.Content).HasMaxLength(1000);
            e.Property(x => x.DeletionReason).HasMaxLength(500);
        });

        b.Entity<UserBan>(e =>
        {
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.UserId, x.IsActive });
            e.Property(x => x.Reason).HasMaxLength(500);
        });

        b.Entity<ModeratorProfile>(e =>
        {
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.UserId, x.IsActive });
            e.Property(x => x.CreatedByAdminId).HasMaxLength(450);
        });
    }
}

