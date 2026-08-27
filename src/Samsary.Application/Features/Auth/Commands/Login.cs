using FluentValidation;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;

namespace Samsary.Application.Features.Auth.Commands;

public sealed record LoginCommand(string Email, string Password)
    : ICommand<Result<AuthResponseDto>>;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public sealed class LoginCommandHandler : ICommandHandler<LoginCommand, AuthResponseDto>
{
    private readonly IIdentityService _identity;

    public LoginCommandHandler(IIdentityService identity) => _identity = identity;

    public Task<Result<AuthResponseDto>> Handle(LoginCommand request, CancellationToken cancellationToken) =>
        _identity.LoginAsync(request.Email, request.Password, cancellationToken);
}
