using Microsoft.EntityFrameworkCore;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Infrastructure.Persistence.Repositories;

public class ListingAlertRepository : Repository<ListingAlert>, IListingAlertRepository
{
    public ListingAlertRepository(ApplicationDbContext db) : base(db) { }

    public async Task<IReadOnlyList<ListingAlert>> GetMatchingAsync(
        int categoryId, string? location, CancellationToken ct = default)
    {
        var query = Db.ListingAlerts
            .Include(a => a.User)
            .Where(a => a.IsActive)
            // Category match: alert has no category (any) or matches the listing's category.
            .Where(a => !a.CategoryId.HasValue || a.CategoryId == categoryId);

        if (!string.IsNullOrWhiteSpace(location))
        {
            // Location match: alert has no location (any) or listing location contains alert location.
            query = query.Where(a =>
                a.Location == null ||
                EF.Functions.ILike(location, $"%{a.Location}%") ||
                EF.Functions.ILike(a.Location, $"%{location}%"));
        }

        return await query.ToListAsync(ct);
    }
}
