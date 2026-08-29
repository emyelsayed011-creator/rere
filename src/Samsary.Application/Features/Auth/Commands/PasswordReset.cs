using FluentValidation;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;

namespace Samsary.Application.Features.Auth.Commands;

// ── Forgot Password ───────────────────────────────────────────────────────────

public sealed record ForgotPasswordCommand(string Email) : ICommand;

public sealed class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator() => RuleFor(x => x.Email).NotEmpty().EmailAddress();
}

public sealed class ForgotPasswordCommandHandler : ICommandHandler<ForgotPasswordCommand>
{
    private readonly IIdentityService _identity;
    public ForgotPasswordCommandHandler(IIdentityService identity) => _identity = identity;

    public Task<Result> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken) =>
        _identity.ForgotPasswordAsync(request.Email, cancellationToken);
}

// ── Reset Password ────────────────────────────────────────────────────────────

public sealed record ResetPasswordCommand(string Email, string Token, string NewPassword) : ICommand;

public sealed class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8);
    }
}

public sealed class ResetPasswordCommandHandler : ICommandHandler<ResetPasswordCommand>
{
    private readonly IIdentityService _identity;
    public ResetPasswordCommandHandler(IIdentityService identity) => _identity = identity;

    public Task<Result> Handle(ResetPasswordCommand request, CancellationToken cancellationToken) =>
        _identity.ResetPasswordAsync(request.Email, request.Token, request.NewPassword, cancellationToken);
}
