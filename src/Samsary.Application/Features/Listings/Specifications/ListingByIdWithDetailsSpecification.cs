using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Listings.Specifications;

/// <summary>Fetches a listing with its Category, Owner and Media eagerly loaded.</summary>
public sealed class ListingByIdWithDetailsSpecification : Specification<Listing>
{
    public ListingByIdWithDetailsSpecification(int id)
    {
        Where(l => l.Id == id);
        AddInclude(l => l.Category!);
        AddInclude(l => l.Owner!);
        AddInclude(l => l.Media);
    }
}
