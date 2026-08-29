using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Samsary.Infrastructure.Persistence;

/// <summary>Allows EF Core design-time tools (dotnet ef migrations) to create the DbContext.</summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        // Walk up to find appsettings.Development.json in the API project
        var basePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "Samsary.Api");
        var config = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString =
            config.GetConnectionString("Default")
            ?? config.GetConnectionString("DefaultConnection")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__Default")
            // Local dev fallback — matches the Docker Compose default values
            ?? "Host=localhost;Port=5432;Database=samsary;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
