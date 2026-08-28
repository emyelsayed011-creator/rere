using Samsary.Domain.Enums;

namespace Samsary.Application.DTOs;

public record CategoryDto(int Id, string Name, string Slug, string? IconClass);

public record ListingMediaDto(int Id, string Url, string PublicId, MediaType MediaType, double? DurationSeconds, string? ThumbnailUrl);

public record ListingDto(
    int Id,
    string Title,
    string Description,
    decimal Price,
    string Currency,
    ListingType Type,
    ListingStatus Status,
    string? Location,
    string? RejectionReason,
    CategoryDto Category,
    string OwnerId,
    string OwnerDisplayName,
    string? OwnerAvatarUrl,
    DateTime CreatedAt,
    IList<ListingMediaDto> Media);

public record CreateListingDto(
    string Title,
    string Description,
    decimal Price,
    string Currency,
    ListingType Type,
    int CategoryId,
    string? Location);

public record UpdateListingDto(
    string Title,
    string Description,
    decimal Price,
    string Currency,
    ListingType Type,
    int CategoryId,
    string? Location);

public record RejectListingDto(string Reason);
