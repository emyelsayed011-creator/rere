using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Samsary.Api.DTOs;
using Samsary.Api.Models;
using Samsary.Api.Services;

namespace Samsary.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICloudinaryService _cloud;

    public UsersController(UserManager<ApplicationUser> userManager, ICloudinaryService cloud)
    {
        _userManager = userManager;
        _cloud = cloud;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var u = await _userManager.FindByIdAsync(UserId);
        if (u is null) return NotFound();
        var roles = await _userManager.GetRolesAsync(u);
        return new UserDto(u.Id, u.Email ?? "", u.DisplayName, u.AvatarUrl, u.Bio, roles);
    }

    [HttpPut("me")]
    public async Task<ActionResult<UserDto>> Update(UpdateProfileDto dto)
    {
        var u = await _userManager.FindByIdAsync(UserId);
        if (u is null) return NotFound();
        u.DisplayName = dto.DisplayName;
        u.Bio = dto.Bio;
        if (!string.IsNullOrWhiteSpace(dto.AvatarUrl)) u.AvatarUrl = dto.AvatarUrl;
        await _userManager.UpdateAsync(u);
        var roles = await _userManager.GetRolesAsync(u);
        return new UserDto(u.Id, u.Email ?? "", u.DisplayName, u.AvatarUrl, u.Bio, roles);
    }

    [HttpPost("me/avatar")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<UserDto>> Avatar(IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest(new { error = "No file." });
        var upload = await _cloud.UploadImageAsync(file);
        var u = await _userManager.FindByIdAsync(UserId);
        if (u is null) return NotFound();
        u.AvatarUrl = upload.Url;
        await _userManager.UpdateAsync(u);
        var roles = await _userManager.GetRolesAsync(u);
        return new UserDto(u.Id, u.Email ?? "", u.DisplayName, u.AvatarUrl, u.Bio, roles);
    }

    [HttpPost("me/change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        var u = await _userManager.FindByIdAsync(UserId);
        if (u is null) return NotFound();
        var r = await _userManager.ChangePasswordAsync(u, dto.CurrentPassword, dto.NewPassword);
        if (!r.Succeeded) return BadRequest(new { errors = r.Errors.Select(e => e.Description) });
        return NoContent();
    }
}
