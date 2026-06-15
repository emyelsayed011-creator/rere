using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Samsary.Api.Data;
using Samsary.Api.DTOs;
using Samsary.Api.Models;
using Samsary.Api.Services;

namespace Samsary.Api.Controllers;

[ApiController]
[Route("api/listings")]
public class ListingsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly ICloudinaryService _cloud;

    public ListingsController(ApplicationDbContext db, ICloudinaryService cloud)
    {
        _db = db;
        _cloud = cloud;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsAdmin => User.IsInRole(SeedData.AdminRole);

    private static ListingDto ToDto(Listing l) => new(
        l.Id, l.Title, l.Description, l.Price, l.Currency, l.Type, l.Status, l.Location, l.RejectionReason,
        new CategoryDto(l.Category!.Id, l.Category.Name, l.Category.Slug, l.Category.IconClass),
        l.OwnerId, l.Owner?.DisplayName ?? "", l.Owner?.AvatarUrl,
        l.CreatedAt,
        l.Media.Select(m => new ListingMediaDto(m.Id, m.Url, m.PublicId, m.MediaType, m.DurationSeconds, m.ThumbnailUrl)).ToList());

    [HttpGet]
    public async Task<object> Search(
        [FromQuery] string? q,
        [FromQuery] int? categoryId,
        [FromQuery] ListingType? type,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        pageSize = Math.Clamp(pageSize, 1, 50);
        var query = _db.Listings
            .Include(l => l.Category).Include(l => l.Owner).Include(l => l.Media)
            .Where(l => l.Status == ListingStatus.Approved);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var like = $"%{q}%";
            query = query.Where(l => EF.Functions.ILike(l.Title, like) || EF.Functions.ILike(l.Description, like));
        }
        if (categoryId.HasValue) query = query.Where(l => l.CategoryId == categoryId);
        if (type.HasValue) query = query.Where(l => l.Type == type);

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new { total, page, pageSize, items = items.Select(ToDto) };
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ListingDto>> Get(int id)
    {
        var l = await _db.Listings.Include(x => x.Category).Include(x => x.Owner).Include(x => x.Media)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (l is null) return NotFound();
        if (l.Status != ListingStatus.Approved && l.OwnerId != UserIdOrNull() && !IsAdminOrNull()) return NotFound();
        return ToDto(l);
    }

    [Authorize]
    [HttpGet("mine")]
    public async Task<IEnumerable<ListingDto>> Mine()
    {
        var items = await _db.Listings.Include(x => x.Category).Include(x => x.Owner).Include(x => x.Media)
            .Where(x => x.OwnerId == UserId).OrderByDescending(x => x.CreatedAt).ToListAsync();
        return items.Select(ToDto);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ListingDto>> Create(CreateListingDto dto)
    {
        if (!await _db.Categories.AnyAsync(c => c.Id == dto.CategoryId))
            return BadRequest(new { error = "Invalid category." });

        var l = new Listing
        {
            Title = dto.Title,
            Description = dto.Description,
            Price = dto.Price,
            Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "USD" : dto.Currency,
            Type = dto.Type,
            CategoryId = dto.CategoryId,
            Location = dto.Location,
            OwnerId = UserId,
            Status = ListingStatus.Pending
        };
        _db.Listings.Add(l);
        await _db.SaveChangesAsync();
        await _db.Entry(l).Reference(x => x.Category).LoadAsync();
        await _db.Entry(l).Reference(x => x.Owner).LoadAsync();
        return CreatedAtAction(nameof(Get), new { id = l.Id }, ToDto(l));
    }

    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ListingDto>> Update(int id, UpdateListingDto dto)
    {
        var l = await _db.Listings.Include(x => x.Category).Include(x => x.Owner).Include(x => x.Media)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (l is null) return NotFound();
        if (l.OwnerId != UserId && !IsAdmin) return Forbid();

        l.Title = dto.Title;
        l.Description = dto.Description;
        l.Price = dto.Price;
        l.Currency = dto.Currency;
        l.Type = dto.Type;
        l.CategoryId = dto.CategoryId;
        l.Location = dto.Location;
        if (!IsAdmin) l.Status = ListingStatus.Pending; // re-moderation after edit

        await _db.SaveChangesAsync();
        await _db.Entry(l).Reference(x => x.Category).LoadAsync();
        return ToDto(l);
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var l = await _db.Listings.Include(x => x.Media).FirstOrDefaultAsync(x => x.Id == id);
        if (l is null) return NotFound();
        if (l.OwnerId != UserId && !IsAdmin) return Forbid();

        foreach (var m in l.Media)
        {
            try { await _cloud.DeleteAsync(m.PublicId, m.MediaType); }
            catch { /* ignore cleanup errors */ }
        }
        _db.Listings.Remove(l);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize]
    [HttpPost("{id:int}/media/image")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<ActionResult<ListingMediaDto>> UploadImage(int id, IFormFile file)
    {
        var l = await _db.Listings.FirstOrDefaultAsync(x => x.Id == id);
        if (l is null) return NotFound();
        if (l.OwnerId != UserId && !IsAdmin) return Forbid();
        if (file is null || file.Length == 0) return BadRequest(new { error = "No file." });

        var up = await _cloud.UploadImageAsync(file);
        var media = new ListingMedia
        {
            ListingId = id, Url = up.Url, PublicId = up.PublicId,
            MediaType = MediaType.Image
        };
        _db.ListingMedia.Add(media);
        await _db.SaveChangesAsync();
        return new ListingMediaDto(media.Id, media.Url, media.PublicId, media.MediaType, media.DurationSeconds, media.ThumbnailUrl);
    }

    [Authorize]
    [HttpPost("{id:int}/media/video")]
    [RequestSizeLimit(200 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 200 * 1024 * 1024)]
    public async Task<ActionResult<ListingMediaDto>> UploadVideo(int id, IFormFile file)
    {
        var l = await _db.Listings.FirstOrDefaultAsync(x => x.Id == id);
        if (l is null) return NotFound();
        if (l.OwnerId != UserId && !IsAdmin) return Forbid();
        if (file is null || file.Length == 0) return BadRequest(new { error = "No file." });

        try
        {
            var up = await _cloud.UploadVideoAsync(file);
            var media = new ListingMedia
            {
                ListingId = id, Url = up.Url, PublicId = up.PublicId,
                MediaType = MediaType.Video,
                DurationSeconds = up.DurationSeconds,
                ThumbnailUrl = up.ThumbnailUrl
            };
            _db.ListingMedia.Add(media);
            await _db.SaveChangesAsync();
            return new ListingMediaDto(media.Id, media.Url, media.PublicId, media.MediaType, media.DurationSeconds, media.ThumbnailUrl);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [Authorize]
    [HttpDelete("{id:int}/media/{mediaId:int}")]
    public async Task<IActionResult> DeleteMedia(int id, int mediaId)
    {
        var l = await _db.Listings.FirstOrDefaultAsync(x => x.Id == id);
        if (l is null) return NotFound();
        if (l.OwnerId != UserId && !IsAdmin) return Forbid();
        var m = await _db.ListingMedia.FirstOrDefaultAsync(x => x.Id == mediaId && x.ListingId == id);
        if (m is null) return NotFound();
        try { await _cloud.DeleteAsync(m.PublicId, m.MediaType); } catch { }
        _db.ListingMedia.Remove(m);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private string? UserIdOrNull() => User.Identity?.IsAuthenticated == true ? UserId : null;
    private bool IsAdminOrNull() => User.Identity?.IsAuthenticated == true && IsAdmin;
}
