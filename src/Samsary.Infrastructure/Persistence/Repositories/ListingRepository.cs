using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Infrastructure.Persistence.Repositories;

public sealed class ListingRepository : Repository<Listing>, IListingRepository
{
    public ListingRepository(ApplicationDbContext db) : base(db) { }
}
