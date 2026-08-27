using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Localization;
using Samsary.Application.Common.Results;

namespace Samsary.Api.Controllers;

/// <summary>
/// Base controller that turns a <see cref="Result"/> into an <see cref="IActionResult"/>, mapping failures
/// to RFC 7807 ProblemDetails based on the <see cref="ErrorType"/>. Messages are localized via the request culture.
/// </summary>
[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    private IStringLocalizer Localizer =>
        HttpContext.RequestServices.GetRequiredService<IStringLocalizer<SharedResource>>();

    /// <summary>Returns the localized string for <paramref name="key"/>, or <paramref name="fallback"/> if no translation exists.</summary>
    private string Localize(string key, string fallback)
    {
        if (string.IsNullOrEmpty(key)) return fallback;
        var localized = Localizer[key];
        return localized.ResourceNotFound ? fallback : localized.Value;
    }
    protected IActionResult HandleResult<TValue>(Result<TValue> result, Func<TValue, IActionResult> onSuccess) =>
        result.IsSuccess ? onSuccess(result.Value) : ToProblem(result.Error);

    protected IActionResult HandleResult<TValue>(Result<TValue> result) =>
        HandleResult(result, value => Ok(value));

    protected IActionResult HandleResult(Result result, Func<IActionResult> onSuccess) =>
        result.IsSuccess ? onSuccess() : ToProblem(result.Error);

    protected IActionResult HandleResult(Result result) =>
        HandleResult(result, () => NoContent());

    private IActionResult ToProblem(Error error)
    {
        if (error is ValidationError validation)
        {
            return ValidationProblem(new ValidationProblemDetails(validation.Errors)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = Localize("Problem.Validation", "One or more validation errors occurred."),
                Type = "https://tools.ietf.org/html/rfc9110#section-15.5.1"
            });
        }

        var (status, titleKey, titleFallback, type) = error.Type switch
        {
            ErrorType.NotFound => (StatusCodes.Status404NotFound, "Problem.NotFound", "Resource not found.",
                "https://tools.ietf.org/html/rfc9110#section-15.5.5"),
            ErrorType.Conflict => (StatusCodes.Status409Conflict, "Problem.Conflict", "Conflict.",
                "https://tools.ietf.org/html/rfc9110#section-15.5.10"),
            ErrorType.Unauthorized => (StatusCodes.Status401Unauthorized, "Problem.Unauthorized", "Unauthorized.",
                "https://tools.ietf.org/html/rfc9110#section-15.5.2"),
            ErrorType.Forbidden => (StatusCodes.Status403Forbidden, "Problem.Forbidden", "Forbidden.",
                "https://tools.ietf.org/html/rfc9110#section-15.5.4"),
            _ => (StatusCodes.Status400BadRequest, "Problem.BadRequest", "Bad request.",
                "https://tools.ietf.org/html/rfc9110#section-15.5.1")
        };

        var detail = Localize(error.Code, error.Description);
        return Problem(detail: string.IsNullOrWhiteSpace(detail) ? null : detail,
            statusCode: status, title: Localize(titleKey, titleFallback), type: type);
    }
}
