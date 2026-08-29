using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;

namespace Samsary.Application.Common.Interfaces;

/// <summary>
/// Abstraction over ASP.NET Core Identity so Application use cases can stay free of UserManager/SignInManager.
/// Implemented in the Infrastructure layer.
/// </summary>
public interface IIdentityService
{
    Task<Result<AuthResponseDto>> RegisterAsync(string email, string password, string displayName, string phone, CancellationToken cancellationToken = default);
    Task<Result<AuthResponseDto>> LoginAsync(string email, string password, CancellationToken cancellationToken = default);
    Task<Result<AuthResponseDto>> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<Result> LogoutAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<Result<UserDto>> GetByIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<Result<UserDto>> UpdateProfileAsync(string userId, string displayName, string? bio, string? avatarUrl,
        DateTime? dateOfBirth, string? gender, string? country, string? phone, CancellationToken cancellationToken = default);
    Task<Result<UserDto>> SetAvatarAsync(string userId, string avatarUrl, CancellationToken cancellationToken = default);
    Task<Result> ChangePasswordAsync(string userId, string currentPassword, string newPassword, CancellationToken cancellationToken = default);
    Task<Result> SendEmailVerificationAsync(string userId, CancellationToken cancellationToken = default);
    Task<Result> ConfirmEmailAsync(string userId, string token, CancellationToken cancellationToken = default);

    Task<bool> IsInRoleAsync(string userId, string role, CancellationToken cancellationToken = default);
    Task<Result> AddToRoleAsync(string userId, string role, CancellationToken cancellationToken = default);
    Task<Result> RemoveFromRoleAsync(string userId, string role, CancellationToken cancellationToken = default);
}
