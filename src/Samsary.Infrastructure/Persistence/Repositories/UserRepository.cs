using Microsoft.EntityFrameworkCore;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Infrastructure.Persistence.Repositories;

public sealed class UserRepository : Repository<ApplicationUser>, IUserRepository
{
    public UserRepository(ApplicationDbContext db) : base(db) { }

    public async Task<IReadOnlyList<ApplicationUser>> GetByIdsAsync(
        IEnumerable<string> ids, CancellationToken cancellationToken = default)
    {
        var idList = ids.ToList();
        return await Db.Users.Where(u => idList.Contains(u.Id)).ToListAsync(cancellationToken);
    }
}
