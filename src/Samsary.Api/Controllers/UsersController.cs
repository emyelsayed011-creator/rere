using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Samsary.Api.Infrastructure;
using Samsary.Application.DTOs;
using Samsary.Application.Services.Users;

namespace Samsary.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserProfileService _profiles;

    public UsersController(IUserProfileService profiles) => _profiles = profiles;

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct)
        => Ok(await _profiles.GetCurrentAsync(ct));

    [HttpPut("me")]
    public async Task<ActionResult<UserDto>> Update(UpdateProfileDto dto, CancellationToken ct)
        => Ok(await _profiles.UpdateAsync(dto, ct));

    [HttpPost("me/avatar")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<UserDto>> Avatar(IFormFile file, CancellationToken ct)
        => Ok(await _profiles.UpdateAvatarAsync(new FormFileAdapter(file), ct));

    [HttpPost("me/change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto, CancellationToken ct)
    {
        await _profiles.ChangePasswordAsync(dto, ct);
        return NoContent();
    }
}
