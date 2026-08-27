using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Domain.Repositories;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Alerts.Queries;

public sealed record GetMyAlertsQuery : IQuery<Result<IReadOnlyList<ListingAlertDto>>>;

public sealed class GetMyAlertsQueryHandler : IQueryHandler<GetMyAlertsQuery, IReadOnlyList<ListingAlertDto>>
{
    private readonly IListingAlertRepository _alerts;
    private readonly ICurrentUser _currentUser;

    public GetMyAlertsQueryHandler(IListingAlertRepository alerts, ICurrentUser currentUser)
    {
        _alerts = alerts;
        _currentUser = currentUser;
    }

    public async Task<Result<IReadOnlyList<ListingAlertDto>>> Handle(GetMyAlertsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserIdRequired;
        var alerts = await _alerts.ListAsync(new AlertsByUserSpecification(userId), cancellationToken);
        IReadOnlyList<ListingAlertDto> dtos = alerts.Select(a => new ListingAlertDto(
            a.Id, a.CategoryId, a.Category?.Name, a.Location, a.IsActive, a.CreatedAt)).ToList();
        return Result.Success(dtos);
    }
}
