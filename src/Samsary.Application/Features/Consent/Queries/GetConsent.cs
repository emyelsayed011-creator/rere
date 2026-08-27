using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Consent.Queries;

public sealed record GetConsentQuery(string? SessionId) : IQuery<Result<UserConsentDto?>>;

public sealed class GetConsentQueryHandler : IQueryHandler<GetConsentQuery, UserConsentDto?>
{
    private readonly IUserConsentRepository _consents;
    private readonly ICurrentUser _currentUser;

    public GetConsentQueryHandler(IUserConsentRepository consents, ICurrentUser currentUser)
    {
        _consents = consents;
        _currentUser = currentUser;
    }

    public async Task<Result<UserConsentDto?>> Handle(GetConsentQuery request, CancellationToken cancellationToken)
    {
        Domain.Entities.UserConsent? consent = null;

        if (_currentUser.IsAuthenticated)
            consent = await _consents.GetByUserIdAsync(_currentUser.UserId!, cancellationToken);
        else if (!string.IsNullOrWhiteSpace(request.SessionId))
            consent = await _consents.GetBySessionIdAsync(request.SessionId, cancellationToken);

        if (consent is null) return Result.Success<UserConsentDto?>(null);
        return Result.Success<UserConsentDto?>(Commands.SaveConsentCommandHandler.ToDto(consent));
    }
}
