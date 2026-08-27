using Microsoft.EntityFrameworkCore;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Domain.Entities;
using Samsary.Domain.Enums;

namespace Samsary.Application.Features.Admin.Commands;

// ── Ban a user ────────────────────────────────────────────────────────────────

/// <param name="UserId">Target user ID.</param>
/// <param name="Reason">Displayed to the user in the notification.</param>
/// <param name="DurationHours">Null = permanent ban. A positive value = temporary suspension.</param>
public sealed record BanUserCommand(string UserId, string Reason, int? DurationHours) : ICommand;

public sealed class BanUserCommandHandler : ICommandHandler<BanUserCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUser _admin;
    private readonly INotificationService _notify;

    public BanUserCommandHandler(IApplicationDbContext db, ICurrentUser admin, INotificationService notify)
    {
        _db = db; _admin = admin; _notify = notify;
    }

    public async Task<Result> Handle(BanUserCommand r, CancellationToken ct)
    {
        var user = await _db.Users.FindAsync([r.UserId], ct);
        if (user is null) return Error.NotFound("User.NotFound", "User not found.");

        // Deactivate any existing active bans
        var existing = await _db.UserBans
            .Where(b => b.UserId == r.UserId && b.IsActive)
            .ToListAsync(ct);
        foreach (var b in existing) { b.IsActive = false; b.LiftedAt = DateTime.UtcNow; }

        // Compute ban expiry
        DateTime? until = r.DurationHours.HasValue
            ? DateTime.UtcNow.AddHours(r.DurationHours.Value)
            : null;

        var ban = new UserBan
        {
            UserId = r.UserId,
            Reason = r.Reason,
            BannedUntil = until,
            BannedByAdminId = _admin.UserId ?? string.Empty,
            IsActive = true,
        };
        _db.UserBans.Add(ban);

        // Mark user IsBlocked for permanent bans
        user.IsBlocked = !r.DurationHours.HasValue;
        user.BannedUntil = until;

        await _db.SaveChangesAsync(ct);

        // Notify the user
        var durationText = r.DurationHours.HasValue
            ? $"for {r.DurationHours} hour(s)"
            : "permanently";
        await _notify.NotifyAsync(
            r.UserId,
            NotificationType.UserBanned,
            "Your account has been suspended",
            $"Your account has been suspended {durationText}. Reason: {r.Reason}",
            ct: ct);

        return Result.Success();
    }
}

// ── Lift (unban) a user ───────────────────────────────────────────────────────

public sealed record LiftBanCommand(string UserId) : ICommand;

public sealed class LiftBanCommandHandler : ICommandHandler<LiftBanCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUser _admin;
    private readonly INotificationService _notify;

    public LiftBanCommandHandler(IApplicationDbContext db, ICurrentUser admin, INotificationService notify)
    {
        _db = db; _admin = admin; _notify = notify;
    }

    public async Task<Result> Handle(LiftBanCommand r, CancellationToken ct)
    {
        var user = await _db.Users.FindAsync([r.UserId], ct);
        if (user is null) return Error.NotFound("User.NotFound", "User not found.");

        var activeBans = await _db.UserBans
            .Where(b => b.UserId == r.UserId && b.IsActive)
            .ToListAsync(ct);

        foreach (var b in activeBans)
        {
            b.IsActive = false;
            b.LiftedAt = DateTime.UtcNow;
            b.LiftedByAdminId = _admin.UserId;
        }

        user.IsBlocked = false;
        user.BannedUntil = null;
        await _db.SaveChangesAsync(ct);

        await _notify.NotifyAsync(
            r.UserId,
            NotificationType.UserUnbanned,
            "Your account suspension has been lifted",
            "Your account has been reinstated. Welcome back!",
            ct: ct);

        return Result.Success();
    }
}

// ── Get ban history for a user ────────────────────────────────────────────────

public record BanRecordDto(int Id, string Reason, DateTime BannedAt, DateTime? BannedUntil, bool IsActive, DateTime? LiftedAt);
