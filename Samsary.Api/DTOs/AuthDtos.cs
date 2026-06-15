using System.ComponentModel.DataAnnotations;

namespace Samsary.Api.DTOs;

public record RegisterDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required, MaxLength(80)] string DisplayName);

public record LoginDto(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record AuthResponseDto(string Token, DateTime ExpiresAt, UserDto User);

public record UserDto(string Id, string Email, string DisplayName, string? AvatarUrl, string? Bio, IList<string> Roles);

public record UpdateProfileDto(
    [MaxLength(80)] string DisplayName,
    [MaxLength(500)] string? Bio,
    string? AvatarUrl);

public record ChangePasswordDto(
    [Required] string CurrentPassword,
    [Required, MinLength(8)] string NewPassword);
