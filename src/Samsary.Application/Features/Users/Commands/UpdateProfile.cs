using FluentValidation;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;

namespace Samsary.Application.Features.Users.Commands;

public sealed record UpdateProfileCommand(string DisplayName, string? Bio, string? AvatarUrl,
    DateTime? DateOfBirth = null, string? Gender = null, string? Country = null, string? PhoneNumber = null)
    : ICommand<Result<UserDto>>;

public sealed class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileCommandValidator()
    {
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(80);
        RuleFor(x => x.Bio).MaximumLength(500);
        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Phone number is required.")
            .Matches("^[0-9+()\\-\\s]{7,20}$").WithMessage("Enter a valid phone number.");
    }
}

public sealed class UpdateProfileCommandHandler : ICommandHandler<UpdateProfileCommand, UserDto>
{
    private readonly IIdentityService _identity;
    private readonly ICurrentUser _currentUser;

    public UpdateProfileCommandHandler(IIdentityService identity, ICurrentUser currentUser)
    {
        _identity = identity;
        _currentUser = currentUser;
    }

    public Task<Result<UserDto>> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId)
            return Task.FromResult(Result.Failure<UserDto>(Error.Unauthorized("User.Unauthenticated", "Not authenticated.")));

        return _identity.UpdateProfileAsync(userId, request.DisplayName, request.Bio, request.AvatarUrl,
            request.DateOfBirth, request.Gender, request.Country, request.PhoneNumber, cancellationToken);
    }
}
