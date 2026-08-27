using Microsoft.EntityFrameworkCore;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Infrastructure.Persistence.Repositories;

public class UserConsentRepository : Repository<UserConsent>, IUserConsentRepository
{
    public UserConsentRepository(ApplicationDbContext db) : base(db) { }

    public Task<UserConsent?> GetByUserIdAsync(string userId, CancellationToken ct = default) =>
        Db.UserConsents.Where(c => c.UserId == userId).OrderByDescending(c => c.AcceptedAt).FirstOrDefaultAsync(ct);

    public Task<UserConsent?> GetBySessionIdAsync(string sessionId, CancellationToken ct = default) =>
        Db.UserConsents.Where(c => c.SessionId == sessionId).OrderByDescending(c => c.AcceptedAt).FirstOrDefaultAsync(ct);
}
