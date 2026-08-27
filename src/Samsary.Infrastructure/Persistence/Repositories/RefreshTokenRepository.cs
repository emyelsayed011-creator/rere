using Microsoft.EntityFrameworkCore;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Infrastructure.Persistence.Repositories;

public class RefreshTokenRepository : Repository<RefreshToken>, IRefreshTokenRepository
{
    public RefreshTokenRepository(ApplicationDbContext db) : base(db) { }

    public Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken ct = default) =>
        Db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.TokenHash == tokenHash && !r.IsRevoked, ct);

    public async Task RevokeAllForUserAsync(string userId, CancellationToken ct = default) =>
        await Db.RefreshTokens
            .Where(r => r.UserId == userId && !r.IsRevoked)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.IsRevoked, true), ct);
}
