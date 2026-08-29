using FluentValidation;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;

namespace Samsary.Application.Features.Auth.Commands;

public sealed record RegisterCommand(string Email, string Password, string DisplayName, string Phone)
    : ICommand<Result<AuthResponseDto>>;

public sealed class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(80);
        RuleFor(x => x.Phone).NotEmpty()
            .Matches(@"^(\+?2)?01[0125][0-9]{8}$")
            .WithMessage("Enter a valid Egyptian phone number");
    }
}

public sealed class RegisterCommandHandler : ICommandHandler<RegisterCommand, AuthResponseDto>
{
    private readonly IIdentityService _identity;

    public RegisterCommandHandler(IIdentityService identity) => _identity = identity;

    public Task<Result<AuthResponseDto>> Handle(RegisterCommand request, CancellationToken cancellationToken) =>
        _identity.RegisterAsync(request.Email, request.Password, request.DisplayName, request.Phone, cancellationToken);
}
