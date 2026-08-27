using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Alerts.Queries;

public sealed class AlertsByUserSpecification : Specification<ListingAlert>
{
    public AlertsByUserSpecification(string userId)
    {
        Where(a => a.UserId == userId);
        AddInclude(a => a.Category!);
        ApplyOrderByDescending(a => a.CreatedAt);
    }
}
