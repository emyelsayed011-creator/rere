using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Listings.Specifications;

/// <summary>Returns all listings belonging to a specific owner, ordered newest first.</summary>
public sealed class ListingsByOwnerSpecification : Specification<Listing>
{
    public ListingsByOwnerSpecification(string ownerId)
    {
        Where(l => l.OwnerId == ownerId);
        AddInclude(l => l.Category!);
        AddInclude(l => l.Media);
        ApplyOrderByDescending(l => l.CreatedAt);
    }
}
