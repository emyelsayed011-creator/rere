using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;
using Samsary.Infrastructure.Configuration;
using Samsary.Infrastructure.Persistence;
using Samsary.Infrastructure.Services;
using System.Text;

namespace Samsary.Infrastructure.Identity;

/// <summary>Identity-backed implementation of <see cref="IIdentityService"/> returning <see cref="Result"/> values.</summary>
public sealed class IdentityService : IIdentityService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IJwtTokenService _jwt;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IUnitOfWork _uow;
    private readonly IEmailService _email;
    private readonly JwtSettings _jwtSettings;
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<IdentityService> _logger;

    public IdentityService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtTokenService jwt,
        IRefreshTokenRepository refreshTokens,
        IUnitOfWork uow,
        IEmailService email,
        IOptions<JwtSettings> jwtSettings,
        IOptions<EmailSettings> emailSettings,
        ILogger<IdentityService> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwt = jwt;
        _refreshTokens = refreshTokens;
        _uow = uow;
        _email = email;
        _jwtSettings = jwtSettings.Value;
        _emailSettings = emailSettings.Value;
        _logger = logger;
    }

    public async Task<Result<AuthResponseDto>> RegisterAsync(string email, string password, string displayName, string phone, CancellationToken cancellationToken = default)
    {
        if (await _userManager.FindByEmailAsync(email) is not null)
            return Error.Conflict("Auth.EmailTaken", "Email already registered.");

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            DisplayName = displayName,
            PhoneNumber = phone,
            EmailConfirmed = false
        };

        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
            return IdentityErrors("Password", result);

        await _userManager.AddToRoleAsync(user, SeedData.UserRole);
        _logger.LogInformation("User registered {Email}", email);

        // Fire-and-forget verification email (failure is non-fatal).
        _ = SendVerificationEmailAsync(user);

        return await IssueFullAuthAsync(user, cancellationToken);
    }

    public async Task<Result<AuthResponseDto>> LoginAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null) return Error.Unauthorized("Auth.InvalidCredentials", "Invalid credentials.");

        // Auto-lift expired temporary bans before checking
        if (user.BannedUntil.HasValue && user.BannedUntil <= DateTime.UtcNow)
        {
            user.IsBlocked = false;
            user.BannedUntil = null;
            await _userManager.UpdateAsync(user);
        }

        if (user.IsBlocked || (user.BannedUntil.HasValue && user.BannedUntil > DateTime.UtcNow))
            return Error.Unauthorized("Auth.InvalidCredentials", "Invalid credentials.");

        var check = await _signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
        if (!check.Succeeded)
            return Error.Unauthorized("Auth.InvalidCredentials", "Invalid credentials.");

        return await IssueFullAuthAsync(user, cancellationToken);
    }

    public async Task<Result<AuthResponseDto>> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var hash = _jwt.HashToken(refreshToken);
        var stored = await _refreshTokens.GetByHashAsync(hash, cancellationToken);

        if (stored is null || stored.IsRevoked || stored.ExpiresAt < DateTime.UtcNow)
            return Error.Unauthorized("Auth.InvalidToken", "Refresh token is invalid or expired.");

        var user = stored.User;
        if (user is null) return Error.Unauthorized("Auth.InvalidToken", "Refresh token is invalid or expired.");

        // Auto-lift expired temporary bans
        if (user.BannedUntil.HasValue && user.BannedUntil <= DateTime.UtcNow)
        {
            user.IsBlocked = false;
            user.BannedUntil = null;
            await _userManager.UpdateAsync(user);
        }

        if (user.IsBlocked || (user.BannedUntil.HasValue && user.BannedUntil > DateTime.UtcNow))
            return Error.Unauthorized("Auth.InvalidToken", "Refresh token is invalid or expired.");

        // Rotate: revoke old token, issue new one.
        var newRawToken = _jwt.GenerateRefreshToken();
        var newHash = _jwt.HashToken(newRawToken);

        stored.IsRevoked = true;
        stored.ReplacedByTokenHash = newHash;
        _refreshTokens.Update(stored);

        _refreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = newHash,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenDays)
        });

        await _uow.SaveChangesAsync(cancellationToken);

        var (accessToken, expiresAt) = await _jwt.CreateTokenAsync(user);
        var roles = await _userManager.GetRolesAsync(user);
        return new AuthResponseDto(accessToken, expiresAt,
            new UserDto(user.Id, user.Email ?? "", user.DisplayName, user.AvatarUrl, user.Bio, roles),
            newRawToken);
    }

    public async Task<Result> LogoutAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var hash = _jwt.HashToken(refreshToken);
        var stored = await _refreshTokens.GetByHashAsync(hash, cancellationToken);
        if (stored is null) return Result.Success(); // idempotent

        stored.IsRevoked = true;
        _refreshTokens.Update(stored);
        await _uow.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result<UserDto>> GetByIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        return user is null
            ? Error.NotFound("User.NotFound", "User not found.")
            : await ToDtoAsync(user);
    }

    public async Task<Result<UserDto>> UpdateProfileAsync(string userId, string displayName, string? bio, string? avatarUrl,
        DateTime? dateOfBirth, string? gender, string? country, string? phone, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Error.NotFound("User.NotFound", "User not found.");

        user.DisplayName = displayName;
        user.Bio = bio;
        if (!string.IsNullOrWhiteSpace(avatarUrl)) user.AvatarUrl = avatarUrl;
        user.DateOfBirth = dateOfBirth;
        user.Gender = gender?.ToLowerInvariant();
        user.Country = country?.ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(phone)) user.PhoneNumber = phone;

        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded
            ? await ToDtoAsync(user)
            : IdentityErrors("Profile", result);
    }

    public async Task<Result<UserDto>> SetAvatarAsync(string userId, string avatarUrl, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Error.NotFound("User.NotFound", "User not found.");

        user.AvatarUrl = avatarUrl;
        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded
            ? await ToDtoAsync(user)
            : IdentityErrors("Avatar", result);
    }

    public async Task<Result> ChangePasswordAsync(string userId, string currentPassword, string newPassword, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Error.NotFound("User.NotFound", "User not found.");

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        return result.Succeeded
            ? Result.Success()
            : IdentityErrors("Password", result);
    }

    public async Task<Result> SendEmailVerificationAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Error.NotFound("User.NotFound", "User not found.");
        if (user.EmailConfirmed) return Result.Success(); // already verified
        await SendVerificationEmailAsync(user);
        return Result.Success();
    }

    public async Task<Result> ConfirmEmailAsync(string userId, string token, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Error.NotFound("User.NotFound", "User not found.");

        var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(token));
        var result = await _userManager.ConfirmEmailAsync(user, decodedToken);
        return result.Succeeded ? Result.Success() : IdentityErrors("EmailConfirmation", result);
    }

    public async Task<Result> ForgotPasswordAsync(string email, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(email);
        // Return success even if user not found — prevents email enumeration.
        if (user is null) return Result.Success();

        var rawToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(rawToken));
        var link = $"{_emailSettings.AppBaseUrl.TrimEnd('/')}/reset-password?email={Uri.EscapeDataString(email)}&token={encodedToken}";
        try
        {
            await _email.SendAsync(email, $"{_emailSettings.FromName} — إعادة تعيين كلمة المرور",
                EmailTemplate.Notification(
                    _emailSettings.FromName, _emailSettings.AppBaseUrl, "#1a4f7a",
                    "إعادة تعيين كلمة المرور",
                    "طلبت إعادة تعيين كلمة المرور لحسابك على سمسارلي. إذا لم تطلب ذلك تجاهل هذا الإيميل.",
                    ctaLabel: "تعيين كلمة المرور", ctaPath: link),
                cancellationToken);
        }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed to send password reset email to {Email}", email); }

        return Result.Success();
    }

    public async Task<Result> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null) return Error.NotFound("User.NotFound", "User not found.");

        var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(token));
        var result = await _userManager.ResetPasswordAsync(user, decodedToken, newPassword);
        return result.Succeeded ? Result.Success() : IdentityErrors("Password", result);
    }

    public async Task<bool> IsInRoleAsync(string userId, string role, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        return user is not null && await _userManager.IsInRoleAsync(user, role);
    }

    public async Task<Result> AddToRoleAsync(string userId, string role, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Error.NotFound("User.NotFound", "User not found.");
        var result = await _userManager.AddToRoleAsync(user, role);
        return result.Succeeded ? Result.Success() : IdentityErrors("Role", result);
    }

    public async Task<Result> RemoveFromRoleAsync(string userId, string role, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Error.NotFound("User.NotFound", "User not found.");
        if (!await _userManager.IsInRoleAsync(user, role)) return Result.Success();
        var result = await _userManager.RemoveFromRoleAsync(user, role);
        return result.Succeeded ? Result.Success() : IdentityErrors("Role", result);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private async Task<Result<AuthResponseDto>> IssueFullAuthAsync(ApplicationUser user, CancellationToken ct)
    {
        var (accessToken, expiresAt) = await _jwt.CreateTokenAsync(user);
        var roles = await _userManager.GetRolesAsync(user);

        var rawRefreshToken = _jwt.GenerateRefreshToken();
        _refreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = _jwt.HashToken(rawRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenDays)
        });
        await _uow.SaveChangesAsync(ct);

        return new AuthResponseDto(accessToken, expiresAt,
            new UserDto(user.Id, user.Email ?? "", user.DisplayName, user.AvatarUrl, user.Bio, roles,
                user.DateOfBirth, user.Gender, user.Country, user.PhoneNumber, user.EmailConfirmed),
            rawRefreshToken);
    }

    private async Task SendVerificationEmailAsync(ApplicationUser user)
    {
        try
        {
            var rawToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(rawToken));
            var link = $"{_emailSettings.AppBaseUrl.TrimEnd('/')}/confirm-email?userId={user.Id}&token={encodedToken}";
            await _email.SendAsync(
                user.Email!,
                $"{_emailSettings.FromName} — تأكيد حسابك",
                EmailTemplate.Notification(
                    _emailSettings.FromName, _emailSettings.AppBaseUrl, "#1a4f7a",
                    $"مرحباً بك في {_emailSettings.FromName}!",
                    "شكراً لتسجيلك في منصتنا. اضغط على الزر أدناه لتأكيد بريدك الإلكتروني وبدء نشر إعلاناتك.",
                    ctaLabel: "تأكيد البريد الإلكتروني", ctaPath: link),
                CancellationToken.None);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send verification email to {Email}", user.Email);
        }
    }

    private async Task<Result<UserDto>> ToDtoAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        return new UserDto(user.Id, user.Email ?? "", user.DisplayName, user.AvatarUrl, user.Bio, roles,
            user.DateOfBirth, user.Gender, user.Country, user.PhoneNumber, user.EmailConfirmed);
    }

    private static Error IdentityErrors(string key, IdentityResult result) =>
        Error.Validation(new Dictionary<string, string[]>
        {
            [key] = result.Errors.Select(e => e.Description).ToArray()
        });
}

