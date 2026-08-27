using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;

namespace Samsary.Application.Features.Auth.Commands;

public sealed record SendEmailVerificationCommand : ICommand;

public sealed class SendEmailVerificationCommandHandler : ICommandHandler<SendEmailVerificationCommand>
{
    private readonly IIdentityService _identity;
    private readonly ICurrentUser _currentUser;

    public SendEmailVerificationCommandHandler(IIdentityService identity, ICurrentUser currentUser)
    {
        _identity = identity;
        _currentUser = currentUser;
    }

    public Task<Result> Handle(SendEmailVerificationCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserIdRequired;
        return _identity.SendEmailVerificationAsync(userId, cancellationToken);
    }
}
