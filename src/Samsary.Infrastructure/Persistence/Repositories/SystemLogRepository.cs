using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Infrastructure.Persistence.Repositories;

public sealed class SystemLogRepository : Repository<SystemLog>, ISystemLogRepository
{
    public SystemLogRepository(ApplicationDbContext db) : base(db) { }
}
