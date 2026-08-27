using Samsary.Domain.Entities;

namespace Samsary.Domain.Repositories;

public interface IUserConsentRepository : IRepository<UserConsent>
{
    Task<UserConsent?> GetByUserIdAsync(string userId, CancellationToken ct = default);
    Task<UserConsent?> GetBySessionIdAsync(string sessionId, CancellationToken ct = default);
}
