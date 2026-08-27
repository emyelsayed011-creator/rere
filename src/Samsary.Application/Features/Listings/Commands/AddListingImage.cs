using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Listings.Specifications;
using Samsary.Domain.Entities;
using Samsary.Domain.Enums;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Listings.Commands;

public sealed record AddListingImageCommand(int Id, IUploadedFile File) : ICommand<Result<ListingMediaDto>>;

public sealed class AddListingImageCommandHandler : ICommandHandler<AddListingImageCommand, ListingMediaDto>
{
    private readonly IListingRepository _listings;
    private readonly IListingMediaRepository _media;
    private readonly ICloudinaryService _cloud;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;

    public AddListingImageCommandHandler(
        IListingRepository listings, IListingMediaRepository media, ICloudinaryService cloud,
        IUnitOfWork unitOfWork, ICurrentUser currentUser)
    {
        _listings = listings;
        _media = media;
        _cloud = cloud;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Result<ListingMediaDto>> Handle(AddListingImageCommand request, CancellationToken cancellationToken)
    {
        var listing = await _listings.FirstOrDefaultAsync(new ListingByIdSpecification(request.Id), cancellationToken);
        if (listing is null)
            return Error.NotFound("Listing.NotFound", $"Listing {request.Id} was not found.");

        if (listing.OwnerId != _currentUser.UserId && !_currentUser.IsAdmin)
            return Error.Forbidden("Listing.Forbidden", "You do not have access to this listing.");

        if (request.File is null || request.File.Length == 0)
            return Error.Validation(new Dictionary<string, string[]> { ["File"] = ["No file was provided."] });

        var up = await _cloud.UploadImageAsync(request.File, cancellationToken);
        var media = new ListingMedia
        {
            ListingId = request.Id, Url = up.Url, PublicId = up.PublicId, MediaType = MediaType.Image
        };

        _media.Add(media);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return ListingMapper.ToMediaDto(media);
    }
}
