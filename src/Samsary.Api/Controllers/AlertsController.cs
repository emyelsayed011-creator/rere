using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Samsary.Application.Features.Alerts.Commands;
using Samsary.Application.Features.Alerts.Queries;

namespace Samsary.Api.Controllers;

[Authorize]
[Route("api/alerts")]
public class AlertsController : ApiControllerBase
{
    private readonly ISender _sender;
    public AlertsController(ISender sender) => _sender = sender;

    /// <summary>Get all listing alert subscriptions for the current user.</summary>
    [HttpGet]
    public async Task<IActionResult> GetMyAlerts(CancellationToken ct)
        => HandleResult(await _sender.Send(new GetMyAlertsQuery(), ct));

    /// <summary>Subscribe to listing alerts for a category and/or location.</summary>
    [HttpPost]
    public async Task<IActionResult> Subscribe([FromBody] SubscribeAlertCommand command, CancellationToken ct)
        => HandleResult(await _sender.Send(command, ct),
            value => CreatedAtAction(nameof(GetMyAlerts), value));

    /// <summary>Remove a listing alert subscription.</summary>
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Unsubscribe(long id, CancellationToken ct)
        => HandleResult(await _sender.Send(new UnsubscribeAlertCommand(id), ct));
}
