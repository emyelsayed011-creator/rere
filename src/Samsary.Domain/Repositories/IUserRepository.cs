using Samsary.Domain.Entities;

namespace Samsary.Domain.Repositories;

/// <summary>Read/aggregate access to <see cref="ApplicationUser"/>. Identity writes still go through UserManager.</summary>
public interface IUserRepository : IRepository<ApplicationUser>
{
    /// <summary>Batch lookup by primary keys — not expressible as a single specification predicate.</summary>
    Task<IReadOnlyList<ApplicationUser>> GetByIdsAsync(IEnumerable<string> ids, CancellationToken cancellationToken = default);
}
