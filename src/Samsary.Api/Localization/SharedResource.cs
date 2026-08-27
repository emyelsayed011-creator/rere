namespace Samsary.Api;

/// <summary>
/// Marker type used as the generic argument for <see cref="Microsoft.Extensions.Localization.IStringLocalizer{T}"/>.
/// Localized strings live in <c>Resources/SharedResource.{culture}.resx</c> and are keyed by error code
/// (e.g. <c>Listing.NotFound</c>) or ProblemDetails title key (e.g. <c>Problem.Conflict</c>).
/// </summary>
public sealed class SharedResource
{
}
