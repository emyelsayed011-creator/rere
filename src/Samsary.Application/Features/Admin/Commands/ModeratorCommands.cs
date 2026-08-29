using Microsoft.EntityFrameworkCore;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Domain.Entities;
using Samsary.Domain.Enums;

namespace Samsary.Application.Features.Admin.Commands;

// ── DTO ──────────────────────────────────────────────────────────────────────
public sealed record ModeratorDto(
    string UserId,
    string Email,
    string DisplayName,
    string? AvatarUrl,
    ModeratorPermission Permissions,
    DateTime CreatedAt,
    bool IsActive);

// ── Create moderator ─────────────────────────────────────────────────────────
public sealed record CreateModeratorCommand(string UserId, ModeratorPermission Permissions)
    : ICommand<Result<ModeratorDto>>;

public sealed class CreateModeratorCommandHandler : ICommandHandler<CreateModeratorCommand, ModeratorDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUser _admin;
    private readonly IIdentityService _identity;
    private readonly INotificationService _notify;

    public CreateModeratorCommandHandler(IApplicationDbContext db, ICurrentUser admin,
        IIdentityService identity, INotificationService notify)
    {
        _db = db; _admin = admin; _identity = identity; _notify = notify;
    }

    public async Task<Result<ModeratorDto>> Handle(CreateModeratorCommand r, CancellationToken ct)
    {
        var user = await _db.Users.FindAsync([r.UserId], ct);
        if (user is null) return Error.NotFound("User.NotFound", "User not found.");

        var existing = await _db.ModeratorProfiles
            .FirstOrDefaultAsync(m => m.UserId == r.UserId, ct);

        if (existing is not null)
        {
            if (existing.IsActive)
                return Error.Conflict("Moderator.AlreadyExists", "This user is already a moderator.");
            existing.IsActive = true;
            existing.Permissions = r.Permissions;
            existing.CreatedByAdminId = _admin.UserId ?? string.Empty;
            existing.CreatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.ModeratorProfiles.Add(new ModeratorProfile
            {
                UserId = r.UserId,
                Permissions = r.Permissions,
                CreatedByAdminId = _admin.UserId ?? string.Empty,
                IsActive = true
            });
        }

        if (!await _identity.IsInRoleAsync(r.UserId, "Moderator", ct))
            await _identity.AddToRoleAsync(r.UserId, "Moderator", ct);

        await _db.SaveChangesAsync(ct);

        await _notify.NotifyAsync(r.UserId, NotificationType.Admin,
            "تم تعيينك مشرفاً / You've been assigned as Moderator",
            "تم منحك صلاحيات مشرف على المنصة. يمكنك الآن الوصول إلى لوحة الإدارة.",
            "/admin", NotificationChannel.InApp | NotificationChannel.Email,
            ct: ct);

        return new ModeratorDto(user.Id, user.Email!, user.DisplayName, user.AvatarUrl,
            r.Permissions, DateTime.UtcNow, true);
    }
}

// ── Update moderator permissions ─────────────────────────────────────────────
public sealed record UpdateModeratorPermissionsCommand(string UserId, ModeratorPermission Permissions)
    : ICommand<Result<ModeratorDto>>;

public sealed class UpdateModeratorPermissionsCommandHandler : ICommandHandler<UpdateModeratorPermissionsCommand, ModeratorDto>
{
    private readonly IApplicationDbContext _db;

    public UpdateModeratorPermissionsCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<Result<ModeratorDto>> Handle(UpdateModeratorPermissionsCommand r, CancellationToken ct)
    {
        var profile = await _db.ModeratorProfiles
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.UserId == r.UserId && m.IsActive, ct);

        if (profile is null) return Error.NotFound("Moderator.NotFound", "Moderator not found.");

        profile.Permissions = r.Permissions;
        await _db.SaveChangesAsync(ct);

        return new ModeratorDto(
            profile.UserId, profile.User.Email!, profile.User.DisplayName,
            profile.User.AvatarUrl, profile.Permissions, profile.CreatedAt, true);
    }
}

// ── Remove moderator ─────────────────────────────────────────────────────────
public sealed record RemoveModeratorCommand(string UserId) : ICommand;

public sealed class RemoveModeratorCommandHandler : ICommandHandler<RemoveModeratorCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IIdentityService _identity;

    public RemoveModeratorCommandHandler(IApplicationDbContext db, IIdentityService identity)
    {
        _db = db; _identity = identity;
    }

    public async Task<Result> Handle(RemoveModeratorCommand r, CancellationToken ct)
    {
        var profile = await _db.ModeratorProfiles
            .FirstOrDefaultAsync(m => m.UserId == r.UserId && m.IsActive, ct);

        if (profile is null) return Error.NotFound("Moderator.NotFound", "Moderator not found.");

        profile.IsActive = false;
        await _db.SaveChangesAsync(ct);

        await _identity.RemoveFromRoleAsync(r.UserId, "Moderator", ct);
        return Result.Success();
    }
}
