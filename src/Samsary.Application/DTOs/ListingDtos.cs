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
    IList<ListingMediaDto> Media,
    int ViewCount,
    bool IsFavorited);

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

public record CreateCategoryDto(string Name, string Slug, string? IconClass);

public record UpdateCategoryDto(string Name, string Slug, string? IconClass);

public record AdminCreateListingDto(
    string OwnerId,
    string Title,
    string Description,
    decimal Price,
    string Currency,
    ListingType Type,
    int CategoryId,
    string? Location);
