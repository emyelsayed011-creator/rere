namespace Samsary.Application.DTOs;

public record RegisterDto(string Email, string Password, string DisplayName);

public record LoginDto(string Email, string Password);

public record AuthResponseDto(string Token, DateTime ExpiresAt, UserDto User, string RefreshToken);

public record UserDto(string Id, string Email, string DisplayName, string? AvatarUrl, string? Bio, IList<string> Roles,
    DateTime? DateOfBirth = null, string? Gender = null, string? Country = null);

public record UpdateProfileDto(string DisplayName, string? Bio, string? AvatarUrl);

public record ChangePasswordDto(string CurrentPassword, string NewPassword);
