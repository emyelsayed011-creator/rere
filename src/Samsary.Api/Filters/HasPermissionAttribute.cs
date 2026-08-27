using Microsoft.AspNetCore.Authorization;
using Samsary.Domain.Enums;

namespace Samsary.Api.Filters;

/// <summary>
/// Grants access to an action when the caller is Admin,
/// or a Moderator whose <see cref="ModeratorPermission"/> flags include <paramref name="permission"/>.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public sealed class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(ModeratorPermission permission)
        : base($"Permission:{(int)permission}") { }
}
