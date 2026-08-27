using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Samsary.Api.Filters;
using Samsary.Application.Features.Reviews.Commands;
using Samsary.Application.Features.Reviews.Queries;
using Samsary.Domain.Enums;

namespace Samsary.Api.Controllers;

[Route("api/listings/{listingId:int}/reviews")]
public class ReviewsController : ApiControllerBase
{
    private readonly ISender _sender;
    public ReviewsController(ISender sender) => _sender = sender;

    /// <summary>Get paginated reviews for a listing (public).</summary>
    [HttpGet]
    public async Task<IActionResult> GetReviews(
        int listingId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
        => HandleResult(await _sender.Send(new GetListingReviewsQuery(listingId, page, pageSize), ct));

    /// <summary>Get average rating summary (public).</summary>
    [HttpGet("summary")]
    public async Task<IActionResult> Summary(int listingId, CancellationToken ct)
        => HandleResult(await _sender.Send(new GetReviewSummaryQuery(listingId), ct));

    /// <summary>Submit a review (authenticated users).</summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(
        int listingId,
        [FromBody] CreateReviewCommand body,
        CancellationToken ct)
        => HandleResult(await _sender.Send(body with { ListingId = listingId }, ct));
}

/// <summary>Moderator/Admin review moderation endpoints.</summary>
[HasPermission(ModeratorPermission.ManageReviews)]
[Route("api/admin/reviews")]
public class AdminReviewsController : ApiControllerBase
{
    private readonly ISender _sender;
    public AdminReviewsController(ISender sender) => _sender = sender;

    /// <summary>List all reviews (optionally including soft-deleted).</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25,
        [FromQuery] bool includeDeleted = false,
        CancellationToken ct = default)
        => HandleResult(await _sender.Send(new GetAllReviewsQuery(page, pageSize, includeDeleted), ct));

    /// <summary>Soft-delete a review and notify the author.</summary>
    [HttpDelete("{reviewId:int}")]
    public async Task<IActionResult> Delete(
        int reviewId, [FromBody] DeleteReviewBody body, CancellationToken ct)
        => HandleResult(await _sender.Send(new AdminDeleteReviewCommand(reviewId, body.Reason), ct), () => NoContent());
}

public sealed record DeleteReviewBody(string Reason);
