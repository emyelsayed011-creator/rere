using FluentValidation;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;

namespace Samsary.Application.Features.Users.Commands;

public sealed record ChangePasswordCommand(string CurrentPassword, string NewPassword) : ICommand;

public sealed class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8);
    }
}

public sealed class ChangePasswordCommandHandler : ICommandHandler<ChangePasswordCommand>
{
    private readonly IIdentityService _identity;
    private readonly ICurrentUser _currentUser;

    public ChangePasswordCommandHandler(IIdentityService identity, ICurrentUser currentUser)
    {
        _identity = identity;
        _currentUser = currentUser;
    }

    public Task<Result> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId)
            return Task.FromResult(Result.Failure(Error.Unauthorized("User.Unauthenticated", "Not authenticated.")));

        return _identity.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword, cancellationToken);
    }
}
