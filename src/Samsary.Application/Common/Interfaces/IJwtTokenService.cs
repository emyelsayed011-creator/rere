using Samsary.Domain.Entities;

namespace Samsary.Application.Common.Interfaces;

public interface IJwtTokenService
{
    Task<(string token, DateTime expiresAt)> CreateTokenAsync(ApplicationUser user);
}
