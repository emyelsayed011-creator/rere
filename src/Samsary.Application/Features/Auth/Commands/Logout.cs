using FluentValidation;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;

namespace Samsary.Application.Features.Auth.Commands;

public sealed record LogoutCommand(string RefreshToken) : ICommand;

public sealed class LogoutCommandValidator : AbstractValidator<LogoutCommand>
{
    public LogoutCommandValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public sealed class LogoutCommandHandler : ICommandHandler<LogoutCommand>
{
    private readonly IIdentityService _identity;

    public LogoutCommandHandler(IIdentityService identity) => _identity = identity;

    public Task<Result> Handle(LogoutCommand request, CancellationToken cancellationToken) =>
        _identity.LogoutAsync(request.RefreshToken, cancellationToken);
}
