using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Samsary.Application.Common.Messaging;

namespace Samsary.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<DependencyInjectionMarker>();

        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjectionMarker).Assembly));

        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        return services;
    }
}

/// <summary>Marker type used to locate this assembly for validator scanning.</summary>
internal sealed class DependencyInjectionMarker;
