using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Admin.Specifications;

/// <summary>Count-only spec for blocked users (used in the admin dashboard counter).</summary>
public sealed class BlockedUsersCountSpecification : Specification<ApplicationUser>
{
    public BlockedUsersCountSpecification() => Where(u => u.IsBlocked);
}
