using Microsoft.EntityFrameworkCore;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Models;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Reviews.Commands;

namespace Samsary.Application.Features.Reviews.Queries;

// ── Get reviews for a listing ─────────────────────────────────────────────────

public sealed record GetListingReviewsQuery(int ListingId, int Page = 1, int PageSize = 10)
    : IQuery<Result<PagedResult<ReviewDto>>>;

public sealed class GetListingReviewsQueryHandler
    : IQueryHandler<GetListingReviewsQuery, PagedResult<ReviewDto>>
{
    private readonly IApplicationDbContext _db;
    public GetListingReviewsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<Result<PagedResult<ReviewDto>>> Handle(GetListingReviewsQuery r, CancellationToken ct)
    {
        var query = _db.Reviews
            .Where(x => x.ListingId == r.ListingId && !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt);

        var total = await query.CountAsync(ct);
        var items = await query
            .Include(x => x.Author)
            .Skip((r.Page - 1) * r.PageSize)
            .Take(r.PageSize)
            .ToListAsync(ct);

        var dtos = items.Select(x => CreateReviewCommandHandler.ToDto(x, x.Author)).ToList();
        return new PagedResult<ReviewDto>(dtos, total, r.Page, r.PageSize);
    }
}

// ── Get summary (average + star distribution) ─────────────────────────────────

public sealed record GetReviewSummaryQuery(int ListingId) : IQuery<Result<ReviewSummaryDto>>;

public sealed class GetReviewSummaryQueryHandler : IQueryHandler<GetReviewSummaryQuery, ReviewSummaryDto>
{
    private readonly IApplicationDbContext _db;
    public GetReviewSummaryQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<Result<ReviewSummaryDto>> Handle(GetReviewSummaryQuery r, CancellationToken ct)
    {
        var ratings = await _db.Reviews
            .Where(x => x.ListingId == r.ListingId && !x.IsDeleted)
            .Select(x => x.Rating)
            .ToListAsync(ct);

        if (ratings.Count == 0)
            return new ReviewSummaryDto(0, 0, [0, 0, 0, 0, 0]);

        var avg = ratings.Average();
        var counts = new int[5];
        foreach (var s in ratings) counts[s - 1]++;
        return new ReviewSummaryDto(Math.Round(avg, 1), ratings.Count, counts);
    }
}

// ── Admin: get all reviews (for moderation) ───────────────────────────────────

public sealed record GetAllReviewsQuery(int Page = 1, int PageSize = 25, bool IncludeDeleted = false)
    : IQuery<Result<PagedResult<ReviewDto>>>;

public sealed class GetAllReviewsQueryHandler : IQueryHandler<GetAllReviewsQuery, PagedResult<ReviewDto>>
{
    private readonly IApplicationDbContext _db;
    public GetAllReviewsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<Result<PagedResult<ReviewDto>>> Handle(GetAllReviewsQuery r, CancellationToken ct)
    {
        var query = _db.Reviews.AsQueryable();
        if (!r.IncludeDeleted) query = query.Where(x => !x.IsDeleted);
        query = query.OrderByDescending(x => x.CreatedAt);

        var total = await query.CountAsync(ct);
        var items = await query
            .Include(x => x.Author)
            .Skip((r.Page - 1) * r.PageSize).Take(r.PageSize)
            .ToListAsync(ct);

        var dtos = items.Select(x => CreateReviewCommandHandler.ToDto(x, x.Author)).ToList();
        return new PagedResult<ReviewDto>(dtos, total, r.Page, r.PageSize);
    }
}


