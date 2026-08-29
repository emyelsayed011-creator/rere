using Samsary.Domain.Enums;

namespace Samsary.Application.DTOs;

public record CategoryDto(int Id, string Name, string? NameAr, string Slug, string? IconClass);

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
    int ViewCount = 0,
    bool IsFavorited = false,
    bool IsNegotiable = false,
    string? OwnerPhone = null);

public record CreateListingDto(
    string Title,
    string Description,
    decimal Price,
    string Currency,
    ListingType Type,
    int CategoryId,
    string? Location,
    bool IsNegotiable = false);

public record UpdateListingDto(
    string Title,
    string Description,
    decimal Price,
    string Currency,
    ListingType Type,
    int CategoryId,
    string? Location,
    bool IsNegotiable = false,
    ListingStatus? Status = null);

public record RejectListingDto(string Reason);

public record CreateCategoryDto(string Name, string? NameAr, string Slug, string? IconClass);

public record UpdateCategoryDto(string Name, string? NameAr, string Slug, string? IconClass);

public record AdminCreateListingDto(
    string OwnerId,
    string Title,
    string Description,
    decimal Price,
    string Currency,
    ListingType Type,
    int CategoryId,
    string? Location);
