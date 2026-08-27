using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Admin.Specifications;

/// <summary>Returns a page of users ordered by username for the admin users table.</summary>
public sealed class PagedUsersSpecification : Specification<ApplicationUser>
{
    public PagedUsersSpecification(int page, int pageSize)
    {
        ApplyOrderBy(u => u.UserName!);
        ApplyPaging((page - 1) * pageSize, pageSize);
    }
}
