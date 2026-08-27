using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Listings.Specifications;
using Samsary.Domain.Entities;
using Samsary.Domain.Enums;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Listings.Commands;

public sealed record AddListingVideoCommand(int Id, IUploadedFile File) : ICommand<Result<ListingMediaDto>>;

public sealed class AddListingVideoCommandHandler : ICommandHandler<AddListingVideoCommand, ListingMediaDto>
{
    private readonly IListingRepository _listings;
    private readonly IListingMediaRepository _media;
    private readonly ICloudinaryService _cloud;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;

    public AddListingVideoCommandHandler(
        IListingRepository listings, IListingMediaRepository media, ICloudinaryService cloud,
        IUnitOfWork unitOfWork, ICurrentUser currentUser)
    {
        _listings = listings;
        _media = media;
        _cloud = cloud;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Result<ListingMediaDto>> Handle(AddListingVideoCommand request, CancellationToken cancellationToken)
    {
        var listing = await _listings.FirstOrDefaultAsync(new ListingByIdSpecification(request.Id), cancellationToken);
        if (listing is null)
            return Error.NotFound("Listing.NotFound", $"Listing {request.Id} was not found.");

        if (listing.OwnerId != _currentUser.UserId && !_currentUser.IsAdmin)
            return Error.Forbidden("Listing.Forbidden", "You do not have access to this listing.");

        if (request.File is null || request.File.Length == 0)
            return Error.Validation(new Dictionary<string, string[]> { ["File"] = ["No file was provided."] });

        UploadedMedia up;
        try
        {
            up = await _cloud.UploadVideoAsync(request.File, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return Error.Validation(new Dictionary<string, string[]> { ["File"] = [ex.Message] });
        }

        var media = new ListingMedia
        {
            ListingId = request.Id, Url = up.Url, PublicId = up.PublicId, MediaType = MediaType.Video,
            DurationSeconds = up.DurationSeconds, ThumbnailUrl = up.ThumbnailUrl
        };

        _media.Add(media);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return ListingMapper.ToMediaDto(media);
    }
}
