using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Listings.Specifications;

/// <summary>Fetches a listing with only its Media collection loaded (used for media management operations).</summary>
public sealed class ListingByIdWithMediaSpecification : Specification<Listing>
{
    public ListingByIdWithMediaSpecification(int id)
    {
        Where(l => l.Id == id);
        AddInclude(l => l.Media);
    }
}
