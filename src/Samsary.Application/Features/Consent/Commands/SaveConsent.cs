using FluentValidation;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Consent.Commands;

public sealed record SaveConsentCommand(
    bool AnalyticsConsent,
    bool MarketingConsent,
    bool TermsAccepted,
    string TermsVersion,
    bool PrivacyPolicyAccepted,
    string SessionId,
    string? IpAddress = null,
    string? UserAgent = null) : ICommand<Result<UserConsentDto>>;

public sealed class SaveConsentCommandValidator : AbstractValidator<SaveConsentCommand>
{
    public SaveConsentCommandValidator()
    {
        RuleFor(x => x.SessionId).NotEmpty().MaximumLength(128);
        RuleFor(x => x.TermsVersion).NotEmpty().MaximumLength(20).When(x => x.TermsAccepted);
    }
}

public sealed class SaveConsentCommandHandler : ICommandHandler<SaveConsentCommand, UserConsentDto>
{
    private readonly IUserConsentRepository _consents;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _uow;

    public SaveConsentCommandHandler(
        IUserConsentRepository consents, ICurrentUser currentUser, IUnitOfWork uow)
    {
        _consents = consents;
        _currentUser = currentUser;
        _uow = uow;
    }

    public async Task<Result<UserConsentDto>> Handle(SaveConsentCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.IsAuthenticated ? _currentUser.UserId : null;

        // Try to find existing consent record.
        UserConsent? existing = userId is not null
            ? await _consents.GetByUserIdAsync(userId, cancellationToken)
            : await _consents.GetBySessionIdAsync(request.SessionId, cancellationToken);

        if (existing is not null)
        {
            existing.AnalyticsConsent = request.AnalyticsConsent;
            existing.MarketingConsent = request.MarketingConsent;
            existing.TermsAccepted = request.TermsAccepted;
            existing.TermsVersion = request.TermsVersion;
            existing.PrivacyPolicyAccepted = request.PrivacyPolicyAccepted;
            existing.UpdatedAt = DateTime.UtcNow;
            _consents.Update(existing);
        }
        else
        {
            existing = new UserConsent
            {
                UserId = userId,
                SessionId = request.SessionId,
                AnalyticsConsent = request.AnalyticsConsent,
                MarketingConsent = request.MarketingConsent,
                TermsAccepted = request.TermsAccepted,
                TermsVersion = request.TermsVersion,
                PrivacyPolicyAccepted = request.PrivacyPolicyAccepted,
                IpAddress = request.IpAddress,
                UserAgent = request.UserAgent
            };
            _consents.Add(existing);
        }

        await _uow.SaveChangesAsync(cancellationToken);
        return ToDto(existing);
    }

    internal static UserConsentDto ToDto(UserConsent c) => new(
        c.NecessaryConsent, c.AnalyticsConsent, c.MarketingConsent,
        c.TermsAccepted, c.TermsVersion, c.PrivacyPolicyAccepted, c.AcceptedAt);
}
