using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Samsary.Api.Infrastructure;
using Samsary.Application.Common.Models;
using Samsary.Application.DTOs;
using Samsary.Application.Services.Listings;
using Samsary.Domain.Enums;

namespace Samsary.Api.Controllers;

[ApiController]
[Route("api/listings")]
public class ListingsController : ControllerBase
{
    private readonly IListingService _listings;

    public ListingsController(IListingService listings) => _listings = listings;

    [HttpGet]
    public async Task<ActionResult<PagedResult<ListingDto>>> Search(
        [FromQuery] string? q,
        [FromQuery] int? categoryId,
        [FromQuery] ListingType? type,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken ct = default)
        => Ok(await _listings.SearchAsync(q, categoryId, type, page, pageSize, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ListingDto>> Get(int id, CancellationToken ct)
        => Ok(await _listings.GetAsync(id, ct));

    [Authorize]
    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<ListingDto>>> Mine(CancellationToken ct)
        => Ok(await _listings.GetMineAsync(ct));

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ListingDto>> Create(CreateListingDto dto, CancellationToken ct)
    {
        var created = await _listings.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ListingDto>> Update(int id, UpdateListingDto dto, CancellationToken ct)
        => Ok(await _listings.UpdateAsync(id, dto, ct));

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _listings.DeleteAsync(id, ct);
        return NoContent();
    }

    [Authorize]
    [HttpPost("{id:int}/media/image")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<ActionResult<ListingMediaDto>> UploadImage(int id, IFormFile file, CancellationToken ct)
        => Ok(await _listings.AddImageAsync(id, new FormFileAdapter(file), ct));

    [Authorize]
    [HttpPost("{id:int}/media/video")]
    [RequestSizeLimit(200 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 200 * 1024 * 1024)]
    public async Task<ActionResult<ListingMediaDto>> UploadVideo(int id, IFormFile file, CancellationToken ct)
        => Ok(await _listings.AddVideoAsync(id, new FormFileAdapter(file), ct));

    [Authorize]
    [HttpDelete("{id:int}/media/{mediaId:int}")]
    public async Task<IActionResult> DeleteMedia(int id, int mediaId, CancellationToken ct)
    {
        await _listings.DeleteMediaAsync(id, mediaId, ct);
        return NoContent();
    }
}
