using Samsary.Domain.Entities;

namespace Samsary.Domain.Repositories;

public interface IAdvertisementRepository : IRepository<Advertisement>
{
    /// <summary>
    /// Returns active ads for the placement that match the visitor's demographics.
    /// Pass nulls for all demographics to get only untargeted ("all audience") ads.
    /// </summary>
    Task<IReadOnlyList<Advertisement>> GetActiveAsync(
        string placement,
        string? userCountry,
        string? userGender,
        int? userAge,
        string? userLocation,
        CancellationToken ct = default);
}
