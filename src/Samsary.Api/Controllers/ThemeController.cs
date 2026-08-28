using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
            dto.SiteName, dto.FontFamily, dto.FontSizeBase), ct));
}
