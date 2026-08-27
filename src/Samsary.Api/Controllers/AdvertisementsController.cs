using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Samsary.Api.Filters;
using Samsary.Application.Features.Advertisements.Commands;
using Samsary.Application.Features.Advertisements.Queries;
using Samsary.Domain.Enums;

namespace Samsary.Api.Controllers;

[Route("api/advertisements")]
public class AdvertisementsController : ApiControllerBase
{
    private readonly ISender _sender;
    public AdvertisementsController(ISender sender) => _sender = sender;

    /// <summary>Get active ads for a placement slot (public).</summary>
    [HttpGet("{placement}")]
    public async Task<IActionResult> GetActive(string placement, CancellationToken ct)
        => HandleResult(await _sender.Send(new GetActiveAdsQuery(placement), ct));

    /// <summary>Track an ad click (public, fire-and-forget).</summary>
    [HttpPost("{id:int}/click")]
    public async Task<IActionResult> TrackClick(int id, CancellationToken ct)
    {
        await _sender.Send(new TrackAdClickCommand(id), ct);
        return NoContent();
    }

    // ── Admin-only ────────────────────────────────────────────────────────────

    /// <summary>List all advertisements (admin only).</summary>
    [HasPermission(ModeratorPermission.ManageAds)]
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => HandleResult(await _sender.Send(new GetAllAdsQuery(), ct));

    /// <summary>Create a new advertisement (admin only).</summary>
    [HasPermission(ModeratorPermission.ManageAds)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAdvertisementCommand command, CancellationToken ct)
        => HandleResult(await _sender.Send(command, ct));

    /// <summary>Update an advertisement (admin only).</summary>
    [HasPermission(ModeratorPermission.ManageAds)]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAdvertisementRequest body, CancellationToken ct)
        => HandleResult(await _sender.Send(new UpdateAdvertisementCommand(
            id, body.Title, body.Description, body.ImageUrl, body.LinkUrl,
            body.Placement, body.IsActive, body.StartsAt, body.EndsAt,
            body.ListingId, body.TargetAudience,
            body.TargetCountries, body.TargetGenders,
            body.TargetMinAge, body.TargetMaxAge, body.TargetLocations), ct));

    /// <summary>Delete an advertisement (admin only).</summary>
    [HasPermission(ModeratorPermission.ManageAds)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => HandleResult(await _sender.Send(new DeleteAdvertisementCommand(id), ct));
}

public sealed record UpdateAdvertisementRequest(
    string Title, string? Description, string ImageUrl, string? LinkUrl,
    string Placement, bool IsActive, DateTime StartsAt, DateTime? EndsAt,
    int? ListingId = null, string TargetAudience = "all",
    string? TargetCountries = null, string? TargetGenders = null,
    int? TargetMinAge = null, int? TargetMaxAge = null, string? TargetLocations = null);
