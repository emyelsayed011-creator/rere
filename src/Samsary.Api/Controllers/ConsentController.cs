using Microsoft.AspNetCore.Mvc;
using MediatR;
using Samsary.Application.Features.Consent.Commands;
using Samsary.Application.Features.Consent.Queries;

namespace Samsary.Api.Controllers;

[Route("api/consent")]
public class ConsentController : ApiControllerBase
{
    private readonly ISender _sender;
    public ConsentController(ISender sender) => _sender = sender;

    /// <summary>Get stored consent record for the current user or session.</summary>
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? sessionId, CancellationToken ct)
        => HandleResult(await _sender.Send(new GetConsentQuery(sessionId), ct));

    /// <summary>
    /// Save or update the user's consent preferences (cookie banner / terms acceptance).
    /// Works for both authenticated users and anonymous visitors (identified by sessionId).
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Save([FromBody] SaveConsentRequest body, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = HttpContext.Request.Headers.UserAgent.ToString();
        var command = new SaveConsentCommand(
            body.AnalyticsConsent, body.MarketingConsent,
            body.TermsAccepted, body.TermsVersion, body.PrivacyPolicyAccepted,
            body.SessionId, ip, ua);
        return HandleResult(await _sender.Send(command, ct));
    }
}

/// <summary>Request body for <c>POST /api/consent</c>.</summary>
public sealed record SaveConsentRequest(
    bool AnalyticsConsent,
    bool MarketingConsent,
    bool TermsAccepted,
    string TermsVersion,
    bool PrivacyPolicyAccepted,
    string SessionId);

