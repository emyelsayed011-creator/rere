using Samsary.Domain.Entities;

namespace Samsary.Domain.Repositories;

public interface IUserFavoriteRepository : IRepository<UserFavorite>
{
    Task<UserFavorite?> GetAsync(string userId, int listingId, CancellationToken ct = default);
}
