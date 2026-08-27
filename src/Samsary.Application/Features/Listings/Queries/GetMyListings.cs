using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Listings.Specifications;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Listings.Queries;

public sealed record GetMyListingsQuery : IQuery<Result<IReadOnlyList<ListingDto>>>;

public sealed class GetMyListingsQueryHandler : IQueryHandler<GetMyListingsQuery, IReadOnlyList<ListingDto>>
{
    private readonly IListingRepository _listings;
    private readonly ICurrentUser _currentUser;

    public GetMyListingsQueryHandler(IListingRepository listings, ICurrentUser currentUser)
    {
        _listings = listings;
        _currentUser = currentUser;
    }

    public async Task<Result<IReadOnlyList<ListingDto>>> Handle(GetMyListingsQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } ownerId)
            return Error.Unauthorized("User.Unauthenticated", "Not authenticated.");

        var items = await _listings.ListAsync(new ListingsByOwnerSpecification(ownerId), cancellationToken);
        IReadOnlyList<ListingDto> dtos = items.Select(l => ListingMapper.ToDto(l)).ToList();
        return Result.Success(dtos);
    }
}
