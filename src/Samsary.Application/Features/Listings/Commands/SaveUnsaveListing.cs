using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;
using Samsary.Domain.Specifications;
using Samsary.Application.Features.Listings.Specifications;

namespace Samsary.Application.Features.Listings.Commands;

public sealed record SaveListingCommand(int ListingId) : ICommand;
public sealed record UnsaveListingCommand(int ListingId) : ICommand;

public sealed class SaveListingCommandHandler : ICommandHandler<SaveListingCommand>
{
    private readonly IUserFavoriteRepository _favorites;
    private readonly IListingRepository _listings;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _uow;

    public SaveListingCommandHandler(
        IUserFavoriteRepository favorites, IListingRepository listings,
        ICurrentUser currentUser, IUnitOfWork uow)
    {
        _favorites = favorites;
        _listings = listings;
        _currentUser = currentUser;
        _uow = uow;
    }

    public async Task<Result> Handle(SaveListingCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserIdRequired;
        var listing = await _listings.FirstOrDefaultAsync(new ListingByIdSpecification(request.ListingId), cancellationToken);
        if (listing is null) return Error.NotFound("Listing.NotFound", $"Listing {request.ListingId} was not found.");

        var existing = await _favorites.GetAsync(userId, request.ListingId, cancellationToken);
        if (existing is not null) return Result.Success(); // idempotent

        _favorites.Add(new UserFavorite { UserId = userId, ListingId = request.ListingId });
        await _uow.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public sealed class UnsaveListingCommandHandler : ICommandHandler<UnsaveListingCommand>
{
    private readonly IUserFavoriteRepository _favorites;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _uow;

    public UnsaveListingCommandHandler(IUserFavoriteRepository favorites, ICurrentUser currentUser, IUnitOfWork uow)
    {
        _favorites = favorites;
        _currentUser = currentUser;
        _uow = uow;
    }

    public async Task<Result> Handle(UnsaveListingCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserIdRequired;
        var existing = await _favorites.GetAsync(userId, request.ListingId, cancellationToken);
        if (existing is null) return Result.Success(); // idempotent
        _favorites.Remove(existing);
        await _uow.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
