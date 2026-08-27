using Samsary.Domain.Entities;

namespace Samsary.Domain.Repositories;

public interface IRefreshTokenRepository : IRepository<RefreshToken>
{
    Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken ct = default);
    Task RevokeAllForUserAsync(string userId, CancellationToken ct = default);
}
