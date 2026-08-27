using FluentValidation;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;

namespace Samsary.Application.Features.Auth.Commands;

public sealed record RefreshTokenCommand(string RefreshToken) : ICommand<Result<AuthResponseDto>>;

public sealed class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public sealed class RefreshTokenCommandHandler : ICommandHandler<RefreshTokenCommand, AuthResponseDto>
{
    private readonly IIdentityService _identity;

    public RefreshTokenCommandHandler(IIdentityService identity) => _identity = identity;

    public Task<Result<AuthResponseDto>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken) =>
        _identity.RefreshTokenAsync(request.RefreshToken, cancellationToken);
}
