using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.Features.Listings.Specifications;
using Samsary.Domain.Enums;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Admin.Commands;

public sealed record ApproveListingCommand(int Id) : ICommand;

public sealed class ApproveListingCommandHandler : ICommandHandler<ApproveListingCommand>
{
    private readonly IListingRepository _listings;
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notify;
    private readonly INotificationServiceTrigger _trigger;

    public ApproveListingCommandHandler(
        IListingRepository listings, IUnitOfWork unitOfWork,
        INotificationService notify, INotificationServiceTrigger trigger)
    {
        _listings = listings;
        _unitOfWork = unitOfWork;
        _notify = notify;
        _trigger = trigger;
    }

    public async Task<Result> Handle(ApproveListingCommand request, CancellationToken cancellationToken)
    {
        var listing = await _listings.FirstOrDefaultAsync(new ListingByIdSpecification(request.Id), cancellationToken);
        if (listing is null)
            return Error.NotFound("Listing.NotFound", $"Listing {request.Id} was not found.");

        listing.Status = ListingStatus.Approved;
        listing.ApprovedAt = DateTime.UtcNow;
        listing.RejectionReason = null;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Notify the owner.
        await _notify.NotifyAsync(listing.OwnerId, NotificationType.ListingApproved,
            "Listing approved", $"Your listing \"{listing.Title}\" has been approved and is now public.",
            $"/listings/{listing.Id}", NotificationChannel.InApp | NotificationChannel.Email,
            $"<p>Your listing <strong>{listing.Title}</strong> is now live.</p>", ct: cancellationToken);

        // Dispatch alerts to all subscribers who match this listing's category/location (background job).
        await _trigger.ListingApprovedAlertsAsync(listing.Id);

        return Result.Success();
    }
}

