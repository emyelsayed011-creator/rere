using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Users.Specifications;

/// <summary>Fetches a single user by primary key.</summary>
public sealed class UserByIdSpecification : Specification<ApplicationUser>
{
    public UserByIdSpecification(string id) => Where(u => u.Id == id);
}
