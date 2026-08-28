using Samsary.Domain.Enums;

namespace Samsary.Application.DTOs;

public record DashboardDto(
    int Users,
    int BlockedUsers,
    int Listings,
    int PendingListings,
    int ApprovedListings,
    int RejectedListings,
    int ChatMessages,
    int Notifications);

public record PendingListingCategoryDto(int Id, string Name);

public record PendingListingOwnerDto(string Id, string DisplayName, string? Email);

public record PendingListingMediaDto(string Url, MediaType MediaType, string? ThumbnailUrl);

public record PendingListingDto(
    int Id,
    string Title,
    string Description,
    decimal Price,
    string Currency,
    ListingType Type,
    string? Location,
    DateTime CreatedAt,
    PendingListingCategoryDto Category,
    PendingListingOwnerDto Owner,
    IReadOnlyList<PendingListingMediaDto> Media);

public record AdminUserDto(string Id, string? Email, string DisplayName, bool IsBlocked, DateTime CreatedAt);

public record SystemLogDto(
    long Id,
    string Level,
    string Source,
    string Message,
    string? UserId,
    string? IpAddress,
    string? Path,
    string? Method,
    int? StatusCode,
    string? Exception,
    DateTime CreatedAt);

public record BanUserRequestDto(string Reason, int? DurationHours);

public record AdminMessageBodyDto(string Body);

public record CreateModeratorRequestDto(string UserId, int Permissions);

public record UpdateModeratorRequestDto(int Permissions);
