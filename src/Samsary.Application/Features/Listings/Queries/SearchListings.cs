using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Models;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Listings.Specifications;
using Samsary.Domain.Enums;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Listings.Queries;

public sealed record SearchListingsQuery(
    string? Query, int? CategoryId, ListingType? Type, int Page, int PageSize,
    int? Cursor = null, string? OwnerId = null, string? Location = null,
    decimal? PriceMin = null, decimal? PriceMax = null,
    bool? IsNegotiable = null, bool IncludeSold = false)
    : IQuery<Result<PagedResult<ListingDto>>>;

public sealed class SearchListingsQueryHandler : IQueryHandler<SearchListingsQuery, PagedResult<ListingDto>>
{
    private readonly IListingRepository _listings;

    public SearchListingsQueryHandler(IListingRepository listings) => _listings = listings;

    public async Task<Result<PagedResult<ListingDto>>> Handle(SearchListingsQuery request, CancellationToken cancellationToken)
    {
        var pageSize = Math.Clamp(request.PageSize, 1, 50);
        var page = Math.Max(request.Page, 1);

        var items = await _listings.ListAsync(
            new SearchListingsSpecification(request.Query, request.CategoryId, request.Type, page, pageSize,
                afterId: request.Cursor, ownerId: request.OwnerId, location: request.Location,
                priceMin: request.PriceMin, priceMax: request.PriceMax,
                isNegotiable: request.IsNegotiable, includeSold: request.IncludeSold),
            cancellationToken);

        int total = 0;
        if (request.Cursor is null)
        {
            total = await _listings.CountAsync(
                new SearchListingsSpecification(request.Query, request.CategoryId, request.Type, page, pageSize,
                    forCounting: true, ownerId: request.OwnerId, location: request.Location,
                    priceMin: request.PriceMin, priceMax: request.PriceMax,
                    isNegotiable: request.IsNegotiable, includeSold: request.IncludeSold),
                cancellationToken);
        }

        // Next cursor = smallest Id in the result set (we're ordering DESC by Id).
        int? nextCursor = items.Count == pageSize ? items[^1].Id : null;

        return new PagedResult<ListingDto>(items.Select(l => ListingMapper.ToDto(l)).ToList(), total, page, pageSize, nextCursor);
    }
}

