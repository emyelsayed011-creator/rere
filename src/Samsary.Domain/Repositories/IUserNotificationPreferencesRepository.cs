using Samsary.Domain.Entities;

namespace Samsary.Domain.Repositories;

public interface IUserNotificationPreferencesRepository : IRepository<UserNotificationPreferences>
{
    Task<UserNotificationPreferences?> GetByUserIdAsync(string userId, CancellationToken ct = default);
}
