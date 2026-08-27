namespace Samsary.Application.DTOs;

public record AdvertisementDto(
    int Id,
    string Title,
    string? Description,
    string ImageUrl,
    string? LinkUrl,
    string Placement,
    bool IsActive,
    DateTime StartsAt,
    DateTime? EndsAt,
    int ImpressionCount,
    int ClickCount,
    // Targeting
    string TargetAudience,
    string? TargetCountries,
    string? TargetGenders,
    int? TargetMinAge,
    int? TargetMaxAge,
    string? TargetLocations,
    // Linked listing (optional)
    int? ListingId,
    string? ListingTitle,
    decimal? ListingPrice,
    string? ListingCurrency,
    string? ListingLocation,
    string? ListingImageUrl);
