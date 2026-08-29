using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Samsary.Api.Infrastructure;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Theme;
using Samsary.Infrastructure.Persistence;

namespace Samsary.Api.Controllers;

[Route("api/theme")]
public class ThemeController : ApiControllerBase
{
    private readonly ISender _sender;
    public ThemeController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
        => HandleResult(await _sender.Send(new GetThemeQuery(), ct));

    [Authorize(Roles = SeedData.AdminRole)]
    [HttpPut]
    public async Task<IActionResult> Update(UpdateThemeDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(new UpdateThemeCommand(
            dto.PrimaryColor, dto.AccentColor, dto.LogoUrl,
            dto.SiteName, dto.SiteNameAr, dto.FontFamily, dto.FontSizeBase), ct));

    [Authorize(Roles = SeedData.AdminRole)]
    [HttpPost("logo")]
    public async Task<IActionResult> UploadLogo(
        IFormFile file,
        [FromServices] ICloudinaryService cloud,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { detail = "No file provided." });

        var result = await cloud.UploadImageAsync(new FormFileAdapter(file), ct);
        return Ok(new { url = result.Url });
    }
}
