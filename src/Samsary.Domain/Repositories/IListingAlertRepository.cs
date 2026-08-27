using Samsary.Domain.Entities;

namespace Samsary.Domain.Repositories;

public interface IListingAlertRepository : IRepository<ListingAlert>
{
    /// <summary>Returns all active alerts that match the given category and/or location.</summary>
    Task<IReadOnlyList<ListingAlert>> GetMatchingAsync(int categoryId, string? location, CancellationToken ct = default);
}
