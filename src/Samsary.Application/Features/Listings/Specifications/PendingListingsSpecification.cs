using Samsary.Domain.Entities;
using Samsary.Domain.Enums;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Listings.Specifications;

/// <summary>Returns all Pending listings with related data for the admin moderation queue.</summary>
public sealed class PendingListingsSpecification : Specification<Listing>
{
    public PendingListingsSpecification()
    {
        Where(l => l.Status == ListingStatus.Pending);
        AddInclude(l => l.Category!);
        AddInclude(l => l.Owner!);
        AddInclude(l => l.Media);
        ApplyOrderByDescending(l => l.CreatedAt);
    }
}
