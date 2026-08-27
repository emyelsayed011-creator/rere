using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Alerts.Commands;

public sealed class AlertByIdAndUserSpecification : Specification<ListingAlert>
{
    public AlertByIdAndUserSpecification(long alertId, string userId)
    {
        Where(a => a.Id == alertId && a.UserId == userId);
    }
}
