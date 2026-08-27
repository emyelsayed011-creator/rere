using Microsoft.EntityFrameworkCore;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Domain.Entities;

namespace Samsary.Application.Features.Reviews.Commands;

// ── Create review ─────────────────────────────────────────────────────────────

public sealed record CreateReviewCommand(int ListingId, int Rating, string Content)
    : ICommand<Result<ReviewDto>>;

public sealed class CreateReviewCommandHandler : ICommandHandler<CreateReviewCommand, ReviewDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUser _currentUser;
    private readonly IBadWordFilter _filter;

    public CreateReviewCommandHandler(IApplicationDbContext db, ICurrentUser currentUser, IBadWordFilter filter)
    {
        _db = db; _currentUser = currentUser; _filter = filter;
    }

    public async Task<Result<ReviewDto>> Handle(CreateReviewCommand r, CancellationToken ct)
    {
        if (_currentUser.UserId is not { } userId)
            return Error.Unauthorized("Review.Unauthenticated", "Sign in to leave a review.");

        if (r.Rating is < 1 or > 5)
            return Error.Failure("Review.InvalidRating", "Rating must be between 1 and 5.");

        if (string.IsNullOrWhiteSpace(r.Content) || r.Content.Length < 5)
            return Error.Failure("Review.TooShort", "Review must be at least 5 characters.");

        if (r.Content.Length > 1000)
            return Error.Failure("Review.TooLong", "Review cannot exceed 1000 characters.");

        // Bad-word check — reject the request (don't silently sanitize)
        if (_filter.ContainsBadWord(r.Content))
            return Error.Failure("Review.BadWord", "Your review contains inappropriate language. Please revise it.");

        // One review per user per listing
        var exists = await _db.Reviews.AnyAsync(x => x.ListingId == r.ListingId && x.AuthorId == userId && !x.IsDeleted, ct);
        if (exists)
            return Error.Conflict("Review.Duplicate", "You have already reviewed this listing.");

        // Listing must be approved
        var listing = await _db.Listings.Include(l => l.Owner).FirstOrDefaultAsync(l => l.Id == r.ListingId, ct);
        if (listing is null)
            return Error.NotFound("Listing.NotFound", "Listing not found.");

        if (listing.Status != Domain.Enums.ListingStatus.Approved)
            return Error.Failure("Review.ListingNotApproved", "You can only review approved listings.");

        // Author cannot review their own listing
        if (listing.OwnerId == userId)
            return Error.Failure("Review.OwnListing", "You cannot review your own listing.");

        var review = new Review
        {
            ListingId = r.ListingId,
            AuthorId = userId,
            Rating = r.Rating,
            Content = r.Content.Trim(),
        };
        _db.Reviews.Add(review);
        await _db.SaveChangesAsync(ct);

        var author = await _db.Users.FindAsync([userId], ct);
        return ToDto(review, author);
    }

    internal static ReviewDto ToDto(Review r, ApplicationUser? author) => new(
        r.Id, r.ListingId,
        r.AuthorId, author?.DisplayName ?? "Unknown", author?.AvatarUrl,
        r.Rating, r.Content, r.CreatedAt,
        r.IsDeleted, r.DeletionReason);
}

// ── Admin: delete (soft) review ───────────────────────────────────────────────

public sealed record AdminDeleteReviewCommand(int ReviewId, string Reason) : ICommand;

public sealed class AdminDeleteReviewCommandHandler : ICommandHandler<AdminDeleteReviewCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUser _admin;
    private readonly INotificationService _notify;

    public AdminDeleteReviewCommandHandler(IApplicationDbContext db, ICurrentUser admin, INotificationService notify)
    {
        _db = db; _admin = admin; _notify = notify;
    }

    public async Task<Result> Handle(AdminDeleteReviewCommand r, CancellationToken ct)
    {
        var review = await _db.Reviews.FindAsync([r.ReviewId], ct);
        if (review is null) return Error.NotFound("Review.NotFound", "Review not found.");

        review.IsDeleted = true;
        review.DeletedByAdminId = _admin.UserId;
        review.DeletedAt = DateTime.UtcNow;
        review.DeletionReason = r.Reason;
        await _db.SaveChangesAsync(ct);

        await _notify.NotifyAsync(
            review.AuthorId,
            Domain.Enums.NotificationType.ReviewDeleted,
            "Your review was removed",
            $"Your review has been removed by a moderator. Reason: {r.Reason}",
            ct: ct);

        return Result.Success();
    }
}
