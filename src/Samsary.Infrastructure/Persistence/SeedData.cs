using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Samsary.Domain.Entities;

namespace Samsary.Infrastructure.Persistence;

public static class SeedData
{
    public const string AdminRole = "Admin";
    public const string UserRole = "User";
    public const string ModeratorRole = "Moderator";

    public static async Task RunAsync(IServiceProvider services, IConfiguration config)
    {
        using var scope = services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var roleMgr = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userMgr = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        await ctx.Database.MigrateAsync();

        foreach (var role in new[] { AdminRole, UserRole, ModeratorRole })
        {
            if (!await roleMgr.RoleExistsAsync(role))
                await roleMgr.CreateAsync(new IdentityRole(role));
        }

        var adminEmail = config["Seed:AdminEmail"] ?? "admin@samsary.local";
        var adminPwd = config["Seed:AdminPassword"] ?? "Admin#12345";
        var admin = await userMgr.FindByEmailAsync(adminEmail);
        if (admin is null)
        {
            admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                DisplayName = "Administrator"
            };
            await userMgr.CreateAsync(admin, adminPwd);
            await userMgr.AddToRoleAsync(admin, AdminRole);
        }

        if (!await ctx.Categories.AnyAsync())
        {
            ctx.Categories.AddRange(
                new Category { Name = "Apartments",  Slug = "apartments",  IconClass = "bi-building" },
                new Category { Name = "Houses",      Slug = "houses",      IconClass = "bi-house-door" },
                new Category { Name = "Vehicles",    Slug = "vehicles",    IconClass = "bi-car-front" },
                new Category { Name = "Electronics", Slug = "electronics", IconClass = "bi-laptop" },
                new Category { Name = "Furniture",   Slug = "furniture",   IconClass = "bi-lamp" },
                new Category { Name = "Other",       Slug = "other",       IconClass = "bi-box" }
            );
            await ctx.SaveChangesAsync();
        }
    }
}
