using Microsoft.EntityFrameworkCore;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Infrastructure.Persistence.Repositories;

public class AdvertisementRepository : Repository<Advertisement>, IAdvertisementRepository
{
    public AdvertisementRepository(ApplicationDbContext db) : base(db) { }

    public async Task<IReadOnlyList<Advertisement>> GetActiveAsync(
        string placement,
        string? userCountry,
        string? userGender,
        int? userAge,
        string? userLocation,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        // Fetch all active ads for this placement — the list is always small.
        var candidates = await Db.Advertisements
            .Include(a => a.Listing).ThenInclude(l => l!.Media)
            .Where(a => a.IsActive
                        && a.Placement == placement
                        && a.StartsAt <= now
                        && (a.EndsAt == null || a.EndsAt >= now))
            .ToListAsync(ct);

        return candidates.Where(a => MatchesAudience(a, userCountry, userGender, userAge, userLocation)).ToList();
    }

    /// <summary>Returns true when the ad targets this visitor.</summary>
    private static bool MatchesAudience(
        Advertisement ad, string? country, string? gender, int? age, string? location)
    {
        if (ad.TargetAudience == "all") return true;

        // Country filter
        if (!string.IsNullOrWhiteSpace(ad.TargetCountries))
        {
            if (string.IsNullOrWhiteSpace(country)) return false;
            var allowed = ad.TargetCountries.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (!allowed.Any(c => string.Equals(c, country, StringComparison.OrdinalIgnoreCase))) return false;
        }

        // Gender filter
        if (!string.IsNullOrWhiteSpace(ad.TargetGenders))
        {
            if (string.IsNullOrWhiteSpace(gender)) return false;
            var allowed = ad.TargetGenders.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (!allowed.Any(g => string.Equals(g, gender, StringComparison.OrdinalIgnoreCase))) return false;
        }

        // Age range filter
        if (ad.TargetMinAge.HasValue || ad.TargetMaxAge.HasValue)
        {
            if (!age.HasValue) return false;
            if (ad.TargetMinAge.HasValue && age < ad.TargetMinAge) return false;
            if (ad.TargetMaxAge.HasValue && age > ad.TargetMaxAge) return false;
        }

        // Location keyword filter
        if (!string.IsNullOrWhiteSpace(ad.TargetLocations))
        {
            if (string.IsNullOrWhiteSpace(location)) return false;
            var keywords = ad.TargetLocations.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (!keywords.Any(k => location.Contains(k, StringComparison.OrdinalIgnoreCase))) return false;
        }

        return true;
    }
}
