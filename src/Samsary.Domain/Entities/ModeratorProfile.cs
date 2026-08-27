using Samsary.Domain.Enums;

namespace Samsary.Domain.Entities;

/// <summary>Stores the specific permissions granted to a user with the Moderator role.</summary>
public class ModeratorProfile
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    /// <summary>Bitmask of <see cref="ModeratorPermission"/> flags.</summary>
    public ModeratorPermission Permissions { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>ID of the admin who promoted this user to moderator.</summary>
    public string CreatedByAdminId { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
