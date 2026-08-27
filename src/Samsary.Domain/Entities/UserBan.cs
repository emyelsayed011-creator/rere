namespace Samsary.Domain.Entities;

/// <summary>
/// Tracks a ban/suspension placed on a user by an admin.
/// BannedUntil == null means the ban is permanent until explicitly lifted.
/// </summary>
public class UserBan
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    public string Reason { get; set; } = string.Empty;

    public DateTime BannedAt { get; set; } = DateTime.UtcNow;

    /// <summary>UTC date/time the ban expires. Null = permanent.</summary>
    public DateTime? BannedUntil { get; set; }

    public string BannedByAdminId { get; set; } = string.Empty;

    /// <summary>True while the ban is still in force (not yet lifted by admin or expired).</summary>
    public bool IsActive { get; set; } = true;

    public DateTime? LiftedAt { get; set; }
    public string? LiftedByAdminId { get; set; }
}
