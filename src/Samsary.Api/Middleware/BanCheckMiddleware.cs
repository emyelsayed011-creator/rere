using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Samsary.Domain.Entities;

namespace Samsary.Api.Middleware;

/// <summary>
/// Checks ban status on every authenticated API request.
/// Auto-lifts expired temporary bans; rejects active bans with 403.
/// </summary>
public class BanCheckMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx, UserManager<ApplicationUser> userManager)
    {
        if (ctx.User.Identity?.IsAuthenticated == true)
        {
            var userId = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is not null)
            {
                var user = await userManager.FindByIdAsync(userId);
                if (user is not null)
                {
                    var now = DateTime.UtcNow;

                    // Auto-lift expired temporary ban
                    if (user.BannedUntil.HasValue && user.BannedUntil <= now)
                    {
                        user.IsBlocked = false;
                        user.BannedUntil = null;
                        await userManager.UpdateAsync(user);
                    }
                    else if (user.IsBlocked || (user.BannedUntil.HasValue && user.BannedUntil > now))
                    {
                        ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                        await ctx.Response.WriteAsJsonAsync(new
                        {
                            type = "https://tools.ietf.org/html/rfc9110#section-15.5.4",
                            title = "Forbidden",
                            status = 403,
                            code = "User.Banned",
                            detail = "Your account has been suspended."
                        });
                        return;
                    }
                }
            }
        }

        await next(ctx);
    }
}
