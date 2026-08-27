using Samsary.Domain.Entities;
using Samsary.Domain.Enums;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Listings.Specifications;

/// <summary>
/// Count-only specification (no includes, no paging).
/// Pass to <c>IRepository.CountAsync</c> for dashboard counters or search totals.
/// </summary>
public sealed class ListingsCountSpecification : Specification<Listing>
{
    public ListingsCountSpecification(ListingStatus? status = null)
    {
        if (status.HasValue) Where(l => l.Status == status);
    }
}
