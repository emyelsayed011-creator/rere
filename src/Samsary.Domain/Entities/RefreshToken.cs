namespace Samsary.Domain.Entities;

public class RefreshToken
{
    public long Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    /// <summary>SHA-256 hash of the actual token sent to the client.</summary>
    public string TokenHash { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Hash of the token that replaced this one during rotation (for audit).</summary>
    public string? ReplacedByTokenHash { get; set; }
}
