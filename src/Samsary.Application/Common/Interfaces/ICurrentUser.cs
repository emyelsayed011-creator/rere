namespace Samsary.Application.Common.Interfaces;

/// <summary>Provides access to the currently authenticated user.</summary>
public interface ICurrentUser
{
    /// <summary>The authenticated user id, or null when unauthenticated.</summary>
    string? UserId { get; }

    /// <summary>The authenticated user id; throws when unauthenticated.</summary>
    string UserIdRequired { get; }

    bool IsAuthenticated { get; }

    bool IsAdmin { get; }

    bool IsEmailConfirmed { get; }
}
