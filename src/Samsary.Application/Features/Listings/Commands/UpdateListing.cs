using FluentValidation;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Listings.Specifications;
using Samsary.Domain.Enums;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Listings.Commands;

public sealed record UpdateListingCommand(
    int Id, string Title, string Description, decimal Price, string Currency, ListingType Type, int CategoryId, string? Location,
    bool IsNegotiable = false, ListingStatus? Status = null)
    : ICommand<Result<ListingDto>>;

public sealed class UpdateListingCommandValidator : AbstractValidator<UpdateListingCommand>
{
    public UpdateListingCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.Price).GreaterThan(0).LessThanOrEqualTo(999_999_999);
        RuleFor(x => x.Currency).MaximumLength(8);
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.Location).MaximumLength(200);
    }
}

public sealed class UpdateListingCommandHandler : ICommandHandler<UpdateListingCommand, ListingDto>
{
    private readonly IListingRepository _listings;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;

    public UpdateListingCommandHandler(IListingRepository listings, IUnitOfWork unitOfWork, ICurrentUser currentUser)
    {
        _listings = listings;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Result<ListingDto>> Handle(UpdateListingCommand request, CancellationToken cancellationToken)
    {
        var listing = await _listings.FirstOrDefaultAsync(new ListingByIdWithDetailsSpecification(request.Id), cancellationToken);
        if (listing is null)
            return Error.NotFound("Listing.NotFound", $"Listing {request.Id} was not found.");

        if (listing.OwnerId != _currentUser.UserId && !_currentUser.IsAdmin)
            return Error.Forbidden("Listing.Forbidden", "You do not have access to this listing.");

        listing.Title = request.Title;
        listing.Description = request.Description;
        listing.Price = request.Price;
        listing.Currency = request.Currency;
        listing.Type = request.Type;
        listing.CategoryId = request.CategoryId;
        listing.Location = request.Location;
        listing.IsNegotiable = request.IsNegotiable;

        // Owner can mark as Sold/Rented; any other edit resets to Pending for re-moderation
        if (request.Status is ListingStatus.Sold or ListingStatus.Rented)
            listing.Status = request.Status.Value;
        else if (!_currentUser.IsAdmin)
            listing.Status = ListingStatus.Pending;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _listings.FirstOrDefaultAsync(new ListingByIdWithDetailsSpecification(request.Id), cancellationToken);
        return ListingMapper.ToDto(updated!);
    }
}
