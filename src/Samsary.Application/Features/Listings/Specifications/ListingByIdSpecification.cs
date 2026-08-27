using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Listings.Specifications;

/// <summary>Fetches a listing by its primary key with no navigation properties loaded.</summary>
public sealed class ListingByIdSpecification : Specification<Listing>
{
    public ListingByIdSpecification(int id) => Where(l => l.Id == id);
}
