using System.ComponentModel.DataAnnotations;
using Samsary.Api.Models;

namespace Samsary.Api.DTOs;

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
    [Required, MaxLength(200)] string Title,
    [Required, MaxLength(4000)] string Description,
    [Range(0, 999999999)] decimal Price,
    [MaxLength(8)] string Currency,
    ListingType Type,
    int CategoryId,
    [MaxLength(200)] string? Location);

public record UpdateListingDto(
    [Required, MaxLength(200)] string Title,
    [Required, MaxLength(4000)] string Description,
    decimal Price,
    [MaxLength(8)] string Currency,
    ListingType Type,
    int CategoryId,
    [MaxLength(200)] string? Location);

public record RejectListingDto([Required, MaxLength(2000)] string Reason);
