using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.Features.Listings.Specifications;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Listings.Commands;

public sealed record DeleteListingCommand(int Id) : ICommand;

public sealed class DeleteListingCommandHandler : ICommandHandler<DeleteListingCommand>
{
    private readonly IListingRepository _listings;
    private readonly ICloudinaryService _cloud;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;

    public DeleteListingCommandHandler(
        IListingRepository listings, ICloudinaryService cloud, IUnitOfWork unitOfWork, ICurrentUser currentUser)
    {
        _listings = listings;
        _cloud = cloud;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(DeleteListingCommand request, CancellationToken cancellationToken)
    {
        var listing = await _listings.FirstOrDefaultAsync(new ListingByIdWithMediaSpecification(request.Id), cancellationToken);
        if (listing is null)
            return Error.NotFound("Listing.NotFound", $"Listing {request.Id} was not found.");

        if (listing.OwnerId != _currentUser.UserId && !_currentUser.IsAdmin)
            return Error.Forbidden("Listing.Forbidden", "You do not have access to this listing.");

        foreach (var media in listing.Media)
        {
            try { await _cloud.DeleteAsync(media.PublicId, media.MediaType, cancellationToken); }
            catch { /* ignore cleanup errors */ }
        }

        _listings.Remove(listing);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
