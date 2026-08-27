using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.Features.Listings.Specifications;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Listings.Commands;

public sealed record DeleteListingMediaCommand(int Id, int MediaId) : ICommand;

public sealed class DeleteListingMediaCommandHandler : ICommandHandler<DeleteListingMediaCommand>
{
    private readonly IListingRepository _listings;
    private readonly IListingMediaRepository _media;
    private readonly ICloudinaryService _cloud;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;

    public DeleteListingMediaCommandHandler(
        IListingRepository listings, IListingMediaRepository media, ICloudinaryService cloud,
        IUnitOfWork unitOfWork, ICurrentUser currentUser)
    {
        _listings = listings;
        _media = media;
        _cloud = cloud;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(DeleteListingMediaCommand request, CancellationToken cancellationToken)
    {
        var listing = await _listings.FirstOrDefaultAsync(new ListingByIdSpecification(request.Id), cancellationToken);
        if (listing is null)
            return Error.NotFound("Listing.NotFound", $"Listing {request.Id} was not found.");

        if (listing.OwnerId != _currentUser.UserId && !_currentUser.IsAdmin)
            return Error.Forbidden("Listing.Forbidden", "You do not have access to this listing.");

        var media = await _media.GetAsync(request.MediaId, request.Id, cancellationToken);
        if (media is null)
            return Error.NotFound("ListingMedia.NotFound", $"Media {request.MediaId} was not found.");

        try { await _cloud.DeleteAsync(media.PublicId, media.MediaType, cancellationToken); } catch { /* ignore */ }

        _media.Remove(media);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
