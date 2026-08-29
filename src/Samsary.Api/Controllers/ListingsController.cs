using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Samsary.Api.Infrastructure;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Listings.Commands;
using Samsary.Application.Features.Listings.Queries;
using Samsary.Domain.Enums;

namespace Samsary.Api.Controllers;

[Route("api/listings")]
public class ListingsController : ApiControllerBase
{
    private readonly ISender _sender;

    public ListingsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] int? categoryId,
        [FromQuery] ListingType? type,
        [FromQuery] string? ownerId,
        [FromQuery] string? location,
        [FromQuery] decimal? priceMin,
        [FromQuery] decimal? priceMax,
        [FromQuery] bool? isNegotiable,
        [FromQuery] bool includeSold = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken ct = default)
        => HandleResult(await _sender.Send(
            new SearchListingsQuery(q, categoryId, type, page, pageSize,
                OwnerId: ownerId, Location: location,
                PriceMin: priceMin, PriceMax: priceMax,
                IsNegotiable: isNegotiable, IncludeSold: includeSold), ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, CancellationToken ct)
        => HandleResult(await _sender.Send(new GetListingQuery(id), ct));

    [Authorize]
    [HttpGet("mine")]
    public async Task<IActionResult> Mine(CancellationToken ct)
        => HandleResult(await _sender.Send(new GetMyListingsQuery(), ct));

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(CreateListingDto dto, CancellationToken ct)
        => HandleResult(
            await _sender.Send(new CreateListingCommand(
                dto.Title, dto.Description, dto.Price, dto.Currency, dto.Type, dto.CategoryId, dto.Location,
                dto.IsNegotiable), ct),
            created => CreatedAtAction(nameof(Get), new { id = created.Id }, created));

    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateListingDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(new UpdateListingCommand(
            id, dto.Title, dto.Description, dto.Price, dto.Currency, dto.Type, dto.CategoryId, dto.Location,
            dto.IsNegotiable, dto.Status), ct));

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => HandleResult(await _sender.Send(new DeleteListingCommand(id), ct));

    [Authorize]
    [HttpPost("{id:int}/media/image")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<IActionResult> UploadImage(int id, IFormFile file, CancellationToken ct)
        => HandleResult(await _sender.Send(new AddListingImageCommand(id, new FormFileAdapter(file)), ct));

    [Authorize]
    [HttpPost("{id:int}/media/video")]
    [RequestSizeLimit(200 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 200 * 1024 * 1024)]
    public async Task<IActionResult> UploadVideo(int id, IFormFile file, CancellationToken ct)
        => HandleResult(await _sender.Send(new AddListingVideoCommand(id, new FormFileAdapter(file)), ct));

    [Authorize]
    [HttpDelete("{id:int}/media/{mediaId:int}")]
    public async Task<IActionResult> DeleteMedia(int id, int mediaId, CancellationToken ct)
        => HandleResult(await _sender.Send(new DeleteListingMediaCommand(id, mediaId), ct));
}
