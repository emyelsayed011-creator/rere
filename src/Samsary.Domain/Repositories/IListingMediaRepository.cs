using Samsary.Domain.Entities;

namespace Samsary.Domain.Repositories;

public interface IListingMediaRepository : IRepository<ListingMedia>
{
    /// <summary>Compound-key lookup: finds media that belongs to the specific listing.</summary>
    Task<ListingMedia?> GetAsync(int mediaId, int listingId, CancellationToken cancellationToken = default);
}
