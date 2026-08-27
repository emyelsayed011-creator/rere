using FluentValidation;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Categories.Specifications;
using Samsary.Application.Features.Listings;
using Samsary.Application.Features.Listings.Specifications;
using Samsary.Application.Features.Users.Specifications;
using Samsary.Domain.Entities;
using Samsary.Domain.Enums;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Admin.Commands;

public sealed record AdminCreateListingCommand(
    string OwnerId,
    string Title,
    string Description,
    decimal Price,
    string Currency,
    ListingType Type,
    int CategoryId,
    string? Location)
    : ICommand<Result<ListingDto>>;

public sealed class AdminCreateListingCommandValidator : AbstractValidator<AdminCreateListingCommand>
{
    public AdminCreateListingCommandValidator()
    {
        RuleFor(x => x.OwnerId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.Price).InclusiveBetween(0, 999_999_999);
        RuleFor(x => x.Currency).MaximumLength(8);
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.Location).MaximumLength(200);
    }
}

public sealed class AdminCreateListingCommandHandler : ICommandHandler<AdminCreateListingCommand, ListingDto>
{
    private readonly IListingRepository _listings;
    private readonly ICategoryRepository _categories;
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _unitOfWork;

    public AdminCreateListingCommandHandler(
        IListingRepository listings, ICategoryRepository categories,
        IUserRepository users, IUnitOfWork unitOfWork)
    {
        _listings = listings;
        _categories = categories;
        _users = users;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<ListingDto>> Handle(AdminCreateListingCommand request, CancellationToken cancellationToken)
    {
        if (!await _users.AnyAsync(new UserByIdSpecification(request.OwnerId), cancellationToken))
            return Error.NotFound("User.NotFound", $"User '{request.OwnerId}' not found.");

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
            OwnerId = request.OwnerId,
            // Admin-created listings are auto-approved.
            Status = ListingStatus.Approved
        };

        _listings.Add(listing);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var created = await _listings.FirstOrDefaultAsync(new ListingByIdWithDetailsSpecification(listing.Id), cancellationToken);
        return ListingMapper.ToDto(created!);
    }
}
