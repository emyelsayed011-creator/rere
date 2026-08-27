using FluentValidation;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;

namespace Samsary.Application.Features.Auth.Commands;

public sealed record ConfirmEmailCommand(string UserId, string Token) : ICommand;

public sealed class ConfirmEmailCommandValidator : AbstractValidator<ConfirmEmailCommand>
{
    public ConfirmEmailCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Token).NotEmpty();
    }
}

public sealed class ConfirmEmailCommandHandler : ICommandHandler<ConfirmEmailCommand>
{
    private readonly IIdentityService _identity;

    public ConfirmEmailCommandHandler(IIdentityService identity) => _identity = identity;

    public Task<Result> Handle(ConfirmEmailCommand request, CancellationToken cancellationToken) =>
        _identity.ConfirmEmailAsync(request.UserId, request.Token, cancellationToken);
}
