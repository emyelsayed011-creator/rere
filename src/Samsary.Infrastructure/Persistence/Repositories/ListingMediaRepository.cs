using Microsoft.EntityFrameworkCore;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Infrastructure.Persistence.Repositories;

public sealed class ListingMediaRepository : Repository<ListingMedia>, IListingMediaRepository
{
    public ListingMediaRepository(ApplicationDbContext db) : base(db) { }

    public async Task<ListingMedia?> GetAsync(int mediaId, int listingId, CancellationToken cancellationToken = default) =>
        await Db.ListingMedia.FirstOrDefaultAsync(x => x.Id == mediaId && x.ListingId == listingId, cancellationToken);
}
