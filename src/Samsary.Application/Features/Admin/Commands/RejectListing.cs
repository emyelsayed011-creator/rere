using FluentValidation;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.Features.Listings.Specifications;
using Samsary.Domain.Enums;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Admin.Commands;

public sealed record RejectListingCommand(int Id, string Reason) : ICommand;

public sealed class RejectListingCommandValidator : AbstractValidator<RejectListingCommand>
{
    public RejectListingCommandValidator()
    {
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(2000);
    }
}

public sealed class RejectListingCommandHandler : ICommandHandler<RejectListingCommand>
{
    private readonly IListingRepository _listings;
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notify;

    public RejectListingCommandHandler(IListingRepository listings, IUnitOfWork unitOfWork, INotificationService notify)
    {
        _listings = listings;
        _unitOfWork = unitOfWork;
        _notify = notify;
    }

    public async Task<Result> Handle(RejectListingCommand request, CancellationToken cancellationToken)
    {
        var listing = await _listings.FirstOrDefaultAsync(new ListingByIdSpecification(request.Id), cancellationToken);
        if (listing is null)
            return Error.NotFound("Listing.NotFound", $"Listing {request.Id} was not found.");

        listing.Status = ListingStatus.Rejected;
        listing.RejectionReason = request.Reason;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _notify.NotifyAsync(listing.OwnerId, NotificationType.ListingRejected,
            "Listing rejected", $"Your listing \"{listing.Title}\" was rejected: {request.Reason}",
            $"/listings/{listing.Id}", NotificationChannel.InApp | NotificationChannel.Email,
            $"<p>Your listing <strong>{listing.Title}</strong> was rejected.</p><p>Reason: {request.Reason}</p>", ct: cancellationToken);

        return Result.Success();
    }
}
