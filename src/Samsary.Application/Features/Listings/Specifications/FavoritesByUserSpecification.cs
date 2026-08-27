using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Listings.Specifications;

public sealed class FavoritesByUserSpecification : Specification<UserFavorite>
{
    public FavoritesByUserSpecification(string userId)
    {
        Where(f => f.UserId == userId);
        AddInclude(f => f.Listing!);
        AddInclude(f => f.Listing!.Category!);
        AddInclude(f => f.Listing!.Owner!);
    }
}
