using Microsoft.EntityFrameworkCore;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;
using Samsary.Infrastructure.Persistence.Repositories;

namespace Samsary.Infrastructure.Persistence.Repositories;

public class UserFavoriteRepository : Repository<UserFavorite>, IUserFavoriteRepository
{
    public UserFavoriteRepository(ApplicationDbContext db) : base(db) { }

    public Task<UserFavorite?> GetAsync(string userId, int listingId, CancellationToken ct = default) =>
        Db.UserFavorites.FirstOrDefaultAsync(f => f.UserId == userId && f.ListingId == listingId, ct);
}
