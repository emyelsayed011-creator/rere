using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Samsary.Application.Common.Interfaces;
using Samsary.Infrastructure.Persistence;

namespace Samsary.Infrastructure.Identity;

public class CurrentUserService : ICurrentUser
{
    private readonly IHttpContextAccessor _accessor;

    public CurrentUserService(IHttpContextAccessor accessor) => _accessor = accessor;

    public string? UserId =>
        _accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

    public string UserIdRequired =>
        UserId ?? throw new InvalidOperationException("No authenticated user is available.");

    public bool IsAuthenticated =>
        _accessor.HttpContext?.User.Identity?.IsAuthenticated == true;

    public bool IsAdmin =>
        _accessor.HttpContext?.User.IsInRole(SeedData.AdminRole) == true;

    public bool IsEmailConfirmed =>
        _accessor.HttpContext?.User.FindFirstValue("email_verified") == "true";
}
