using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Samsary.Application.Common.Interfaces;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;
using Samsary.Infrastructure.Configuration;
using Samsary.Infrastructure.Identity;
using Samsary.Infrastructure.Persistence;
using Samsary.Infrastructure.Persistence.Repositories;
using Samsary.Infrastructure.Services;
using Samsary.Infrastructure.Services.Notifications;
using Wolverine.EntityFrameworkCore;

namespace Samsary.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
        services.Configure<CloudinarySettings>(configuration.GetSection("Cloudinary"));
        services.Configure<EmailSettings>(configuration.GetSection("Email"));
        services.Configure<SmsSettings>(configuration.GetSection("Sms"));
        services.Configure<RedisSettings>(configuration.GetSection("Redis"));

        // Database with Wolverine outbox integration
        services.AddDbContextWithWolverineIntegration<ApplicationDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("Default")));
        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<ApplicationDbContext>());

        AddRepositories(services);

        // ── Identity ──────────────────────────────────────────────────────────
        services
            .AddIdentity<ApplicationUser, IdentityRole>(opt =>
            {
                opt.Password.RequiredLength = 8;
                opt.Password.RequireDigit = true;
                opt.Password.RequireUppercase = true;
                opt.Password.RequireNonAlphanumeric = true;
                opt.User.RequireUniqueEmail = true;
                opt.Lockout.MaxFailedAccessAttempts = 5;
                opt.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        AddJwtAuthentication(services, configuration);

        // ── Core services ─────────────────────────────────────────────────────
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUserService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<ICloudinaryService, CloudinaryService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<ISmsService, SmsService>();
        services.AddScoped<INotificationChannel, InAppNotificationChannel>();
        services.AddScoped<INotificationChannel, EmailNotificationChannel>();
        services.AddScoped<INotificationChannel, SmsNotificationChannel>();
        services.AddScoped<INotificationChannel, WebPushNotificationChannel>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<INotificationServiceTrigger, NotificationServiceTrigger>();

        services.AddSignalR();

        return services;
    }

    private static void AddRepositories(IServiceCollection services)
    {
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IListingRepository, ListingRepository>();
        services.AddScoped<IListingMediaRepository, ListingMediaRepository>();
        services.AddScoped<IChatMessageRepository, ChatMessageRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<ISystemLogRepository, SystemLogRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserFavoriteRepository, UserFavoriteRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IListingAlertRepository, ListingAlertRepository>();
        services.AddScoped<IUserNotificationPreferencesRepository, UserNotificationPreferencesRepository>();
        services.AddScoped<IUserConsentRepository, UserConsentRepository>();
        services.AddScoped<IAdvertisementRepository, AdvertisementRepository>();

        // Stateless singleton — word list is compiled once
        services.AddSingleton<IBadWordFilter, BadWordFilter>();
    }

    private static void AddJwtAuthentication(IServiceCollection services, IConfiguration configuration)
    {
        var jwt = configuration.GetSection("Jwt").Get<JwtSettings>()!;
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(o =>
            {
                o.SaveToken = true;
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
                o.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) &&
                            (path.StartsWithSegments("/hubs/chat") || path.StartsWithSegments("/hubs/notifications")))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });
        services.AddAuthorization();
    }
}

