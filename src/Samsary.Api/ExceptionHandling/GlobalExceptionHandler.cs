using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Samsary.Application.Common.Exceptions;

namespace Samsary.Api.ExceptionHandling;

/// <summary>
/// Translates application exceptions into RFC 7807 ProblemDetails responses.
/// </summary>
public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly IProblemDetailsService _problemDetailsService;
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(IProblemDetailsService problemDetailsService, ILogger<GlobalExceptionHandler> logger)
    {
        _problemDetailsService = problemDetailsService;
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var problemDetails = MapToProblemDetails(exception);

        if (problemDetails.Status >= 500)
            _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);
        else
            _logger.LogWarning("Handled {Exception}: {Message}", exception.GetType().Name, exception.Message);

        httpContext.Response.StatusCode = problemDetails.Status!.Value;

        return await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = problemDetails
        });
    }

    private static ProblemDetails MapToProblemDetails(Exception exception) => exception switch
    {
        ValidationException validation => new ValidationProblemDetails(validation.Errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "One or more validation errors occurred.",
            Type = "https://tools.ietf.org/html/rfc9110#section-15.5.1"
        },
        NotFoundException => new ProblemDetails
        {
            Status = StatusCodes.Status404NotFound,
            Title = "Resource not found.",
            Detail = exception.Message,
            Type = "https://tools.ietf.org/html/rfc9110#section-15.5.5"
        },
        UnauthorizedException => new ProblemDetails
        {
            Status = StatusCodes.Status401Unauthorized,
            Title = "Unauthorized.",
            Detail = exception.Message,
            Type = "https://tools.ietf.org/html/rfc9110#section-15.5.2"
        },
        ForbiddenAccessException => new ProblemDetails
        {
            Status = StatusCodes.Status403Forbidden,
            Title = "Forbidden.",
            Detail = exception.Message,
            Type = "https://tools.ietf.org/html/rfc9110#section-15.5.4"
        },
        ConflictException => new ProblemDetails
        {
            Status = StatusCodes.Status409Conflict,
            Title = "Conflict.",
            Detail = exception.Message,
            Type = "https://tools.ietf.org/html/rfc9110#section-15.5.10"
        },
        _ => new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "An unexpected error occurred.",
            Type = "https://tools.ietf.org/html/rfc9110#section-15.6.1"
        }
    };
}
