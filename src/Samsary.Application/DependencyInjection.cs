using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Samsary.Application.Services.Admin;
using Samsary.Application.Services.Categories;
using Samsary.Application.Services.Chat;
using Samsary.Application.Services.Listings;
using Samsary.Application.Services.Notifications;

namespace Samsary.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<DependencyInjectionMarker>();

        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IListingService, ListingService>();
        services.AddScoped<IChatService, ChatService>();
        services.AddScoped<INotificationQueryService, NotificationQueryService>();
        services.AddScoped<IAdminService, AdminService>();

        return services;
    }
}

/// <summary>Marker type used to locate this assembly for validator scanning.</summary>
internal sealed class DependencyInjectionMarker;
