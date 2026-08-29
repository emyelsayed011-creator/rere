namespace Samsary.Application.DTOs;

public record RegisterDto(string Email, string Password, string DisplayName, string Phone);

public record LoginDto(string Email, string Password);

public record AuthResponseDto(string Token, DateTime ExpiresAt, UserDto User, string? RefreshToken = null);

public record UserDto(string Id, string Email, string DisplayName, string? AvatarUrl, string? Bio, IList<string> Roles,
    DateTime? DateOfBirth = null, string? Gender = null, string? Country = null, string? Phone = null);

public record UpdateProfileDto(string DisplayName, string? Bio, string? AvatarUrl = null,
    DateTime? DateOfBirth = null, string? Gender = null, string? Country = null, string? Phone = null);

public record ChangePasswordDto(string CurrentPassword, string NewPassword);

public record ResetPasswordDto(string Email, string Token, string NewPassword);

public record ConfirmEmailDto(string UserId, string Token);
