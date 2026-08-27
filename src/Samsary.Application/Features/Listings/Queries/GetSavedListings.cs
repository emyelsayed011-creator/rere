using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Listings.Specifications;
using Samsary.Domain.Repositories;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Listings.Queries;

public sealed record GetSavedListingsQuery : IQuery<Result<IReadOnlyList<ListingDto>>>;

public sealed class GetSavedListingsQueryHandler : IQueryHandler<GetSavedListingsQuery, IReadOnlyList<ListingDto>>
{
    private readonly IUserFavoriteRepository _favorites;
    private readonly ICurrentUser _currentUser;

    public GetSavedListingsQueryHandler(IUserFavoriteRepository favorites, ICurrentUser currentUser)
    {
        _favorites = favorites;
        _currentUser = currentUser;
    }

    public async Task<Result<IReadOnlyList<ListingDto>>> Handle(GetSavedListingsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserIdRequired;
        var favs = await _favorites.ListAsync(new FavoritesByUserSpecification(userId), cancellationToken);
        IReadOnlyList<ListingDto> dtos = favs
            .Where(f => f.Listing is not null)
            .Select(f => ListingMapper.ToDto(f.Listing!, isFavorited: true))
            .ToList();
        return Result.Success(dtos);
    }
}
