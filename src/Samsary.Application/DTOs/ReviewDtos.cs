namespace Samsary.Application.DTOs;

public record ReviewDto(
    int Id,
    int ListingId,
    string AuthorId,
    string AuthorName,
    string? AuthorAvatarUrl,
    int Rating,
    string Content,
    DateTime CreatedAt,
    bool IsDeleted,
    string? DeletionReason);

public record ReviewSummaryDto(
    double AverageRating,
    int TotalCount,
    int[] StarCounts); // index 0 = 1-star, index 4 = 5-star
