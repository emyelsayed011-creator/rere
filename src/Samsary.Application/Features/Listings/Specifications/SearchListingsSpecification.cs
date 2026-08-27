using Microsoft.EntityFrameworkCore;
using Samsary.Domain.Entities;
using Samsary.Domain.Enums;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Listings.Specifications;

/// <summary>
/// Filters approved listings by free-text (PostgreSQL full-text search over the GIN-indexed
/// SearchVector), category and type. Cursor-based pagination is activated when
/// <paramref name="afterId"/> is provided, otherwise falls back to offset pagination.
/// </summary>
public sealed class SearchListingsSpecification : Specification<Listing>
{
    public SearchListingsSpecification(
        string? query, int? categoryId, ListingType? type, int page, int pageSize,
        bool forCounting = false, int? afterId = null)
    {
        Where(l => l.Status == ListingStatus.Approved);

        if (!string.IsNullOrWhiteSpace(query))
        {
            var term = query.Trim();
            // Full-text match using the GIN-indexed tsvector; web-style query supports phrases/operators.
            Where(l => l.SearchVector!.Matches(EF.Functions.WebSearchToTsQuery("english", term)));
        }

        if (categoryId.HasValue) Where(l => l.CategoryId == categoryId);
        if (type.HasValue)       Where(l => l.Type == type);

        // Cursor-based keyset pagination — avoids OFFSET scan on large tables.
        if (afterId.HasValue) Where(l => l.Id < afterId.Value);

        if (!forCounting)
        {
            AddInclude(l => l.Category!);
            AddInclude(l => l.Owner!);
            AddInclude(l => l.Media);
            ApplyOrderByDescending(l => l.Id);

            if (!afterId.HasValue)
                ApplyPaging((page - 1) * pageSize, pageSize);
            else
                ApplyPaging(0, pageSize);
        }
    }
}

