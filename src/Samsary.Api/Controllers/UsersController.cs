using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Samsary.Api.Infrastructure;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Users.Commands;
using Samsary.Application.Features.Users.Queries;

namespace Samsary.Api.Controllers;

[Route("api/users")]
public class UsersController : ApiControllerBase
{
    private readonly ISender _sender;

    public UsersController(ISender sender) => _sender = sender;

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
        => HandleResult(await _sender.Send(new GetCurrentUserQuery(), ct));

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPublicProfile(string id, CancellationToken ct)
        => HandleResult(await _sender.Send(new GetPublicProfileQuery(id), ct));

    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> Update(UpdateProfileDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(
            new UpdateProfileCommand(dto.DisplayName, dto.Bio, dto.AvatarUrl, dto.DateOfBirth, dto.Gender, dto.Country, dto.Phone), ct));

    [Authorize]
    [HttpPost("me/avatar")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Avatar(IFormFile file, CancellationToken ct)
        => HandleResult(await _sender.Send(new UpdateAvatarCommand(new FormFileAdapter(file)), ct));

    [Authorize]
    [HttpPost("me/change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(new ChangePasswordCommand(dto.CurrentPassword, dto.NewPassword), ct));
}
