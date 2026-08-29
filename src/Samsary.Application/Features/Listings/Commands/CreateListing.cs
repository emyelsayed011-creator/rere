using FluentValidation;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Categories.Specifications;
using Samsary.Application.Features.Listings.Specifications;
using Samsary.Domain.Entities;
using Samsary.Domain.Enums;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Listings.Commands;

public sealed record CreateListingCommand(
    string Title, string Description, decimal Price, string Currency, ListingType Type, int CategoryId, string? Location,
    bool IsNegotiable = false)
    : ICommand<Result<ListingDto>>;

public sealed class CreateListingCommandValidator : AbstractValidator<CreateListingCommand>
{
    public CreateListingCommandValidator()
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

public sealed class CreateListingCommandHandler : ICommandHandler<CreateListingCommand, ListingDto>
{
    private readonly IListingRepository _listings;
    private readonly ICategoryRepository _categories;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IApplicationDbContext _db;

    public CreateListingCommandHandler(
        IListingRepository listings, ICategoryRepository categories, IUnitOfWork unitOfWork,
        ICurrentUser currentUser, IApplicationDbContext db)
    {
        _listings = listings;
        _categories = categories;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _db = db;
    }

    public async Task<Result<ListingDto>> Handle(CreateListingCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } ownerId)
            return Error.Unauthorized("User.Unauthenticated", "Not authenticated.");

        // Check from DB — JWT claim may be stale if email was just confirmed
        var user = await _db.Users.FindAsync([ownerId], cancellationToken);
        if (user is null || !user.EmailConfirmed)
            return Error.Forbidden("User.EmailNotConfirmed", "Please confirm your email before creating a listing.");

        if (!await _categories.AnyAsync(new CategoryByIdSpecification(request.CategoryId), cancellationToken))
            return Error.Validation(new Dictionary<string, string[]> { [nameof(request.CategoryId)] = ["Invalid category."] });

        var listing = new Listing
        {
            Title = request.Title,
            Description = request.Description,
            Price = request.Price,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "USD" : request.Currency,
            Type = request.Type,
            CategoryId = request.CategoryId,
            Location = request.Location,
            OwnerId = ownerId,
            IsNegotiable = request.IsNegotiable,
            Status = ListingStatus.Pending
        };

        _listings.Add(listing);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var created = await _listings.FirstOrDefaultAsync(new ListingByIdWithDetailsSpecification(listing.Id), cancellationToken);
        return ListingMapper.ToDto(created!);
    }
}
