using Microsoft.EntityFrameworkCore;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Infrastructure.Persistence.Repositories;

public class UserNotificationPreferencesRepository
    : Repository<UserNotificationPreferences>, IUserNotificationPreferencesRepository
{
    public UserNotificationPreferencesRepository(ApplicationDbContext db) : base(db) { }

    public Task<UserNotificationPreferences?> GetByUserIdAsync(string userId, CancellationToken ct = default) =>
        Db.NotificationPreferences.FirstOrDefaultAsync(p => p.UserId == userId, ct);
}
