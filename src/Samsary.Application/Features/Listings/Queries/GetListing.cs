using Microsoft.EntityFrameworkCore;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Listings.Specifications;
using Samsary.Domain.Enums;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Listings.Queries;

public sealed record GetListingQuery(int Id) : IQuery<Result<ListingDto>>;

public sealed class GetListingQueryHandler : IQueryHandler<GetListingQuery, ListingDto>
{
    private readonly IListingRepository _listings;
    private readonly IUserFavoriteRepository _favorites;
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetListingQueryHandler(
        IListingRepository listings, IUserFavoriteRepository favorites,
        IApplicationDbContext db, ICurrentUser currentUser)
    {
        _listings = listings;
        _favorites = favorites;
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result<ListingDto>> Handle(GetListingQuery request, CancellationToken cancellationToken)
    {
        var listing = await _listings.FirstOrDefaultAsync(new ListingByIdWithDetailsSpecification(request.Id), cancellationToken);
        if (listing is null)
            return Error.NotFound("Listing.NotFound", $"Listing {request.Id} was not found.");

        var canSeeUnpublished = (_currentUser.IsAuthenticated && listing.OwnerId == _currentUser.UserId)
                                || _currentUser.IsAdmin;
        if (listing.Status != ListingStatus.Approved && !canSeeUnpublished)
            return Error.NotFound("Listing.NotFound", $"Listing {request.Id} was not found.");

        // Atomically increment view count for approved listings (skip for owners and admins to avoid skewing).
        if (listing.Status == ListingStatus.Approved && listing.OwnerId != _currentUser.UserId)
        {
            await _db.Listings
                .Where(l => l.Id == request.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(l => l.ViewCount, l => l.ViewCount + 1), cancellationToken);
            listing.ViewCount++;
        }

        var isFavorited = _currentUser.IsAuthenticated &&
                          await _favorites.GetAsync(_currentUser.UserId!, request.Id, cancellationToken) is not null;

        return ListingMapper.ToDto(listing, isFavorited);
    }
}

