using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Models;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Listings.Specifications;
using Samsary.Domain.Enums;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Listings.Queries;

/// <param name="Cursor">Optional opaque cursor (last item Id) for keyset pagination.
/// When provided, <paramref name="Page"/> is ignored.</param>
public sealed record SearchListingsQuery(
    string? Query, int? CategoryId, ListingType? Type, int Page, int PageSize, int? Cursor = null)
    : IQuery<Result<PagedResult<ListingDto>>>;

public sealed class SearchListingsQueryHandler : IQueryHandler<SearchListingsQuery, PagedResult<ListingDto>>
{
    private readonly IListingRepository _listings;

    public SearchListingsQueryHandler(IListingRepository listings) => _listings = listings;

    public async Task<Result<PagedResult<ListingDto>>> Handle(SearchListingsQuery request, CancellationToken cancellationToken)
    {
        var pageSize = Math.Clamp(request.PageSize, 1, 50);
        var page = Math.Max(request.Page, 1);

        // When using cursor-based pagination, total count is not fetched (expensive + not useful for infinite scroll).
        int total = 0;
        if (request.Cursor is null)
        {
            total = await _listings.CountAsync(
                new SearchListingsSpecification(request.Query, request.CategoryId, request.Type, page, pageSize, forCounting: true),
                cancellationToken);
        }

        var items = await _listings.ListAsync(
            new SearchListingsSpecification(request.Query, request.CategoryId, request.Type, page, pageSize, afterId: request.Cursor),
            cancellationToken);

        // Next cursor = smallest Id in the result set (we're ordering DESC by Id).
        int? nextCursor = items.Count == pageSize ? items[^1].Id : null;

        return new PagedResult<ListingDto>(total, page, pageSize, items.Select(l => ListingMapper.ToDto(l)).ToList(), nextCursor);
    }
}

