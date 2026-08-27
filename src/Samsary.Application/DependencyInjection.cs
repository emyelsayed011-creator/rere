using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Samsary.Application.Common.Messaging;

namespace Samsary.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjectionMarker).Assembly;

        services.AddValidatorsFromAssemblyContaining<DependencyInjectionMarker>();

        // MediatR: discovers all command/query handlers in this assembly and runs the validation behavior.
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });

        return services;
    }
}

/// <summary>Marker type used to locate this assembly for validator and handler scanning.</summary>
internal sealed class DependencyInjectionMarker;
