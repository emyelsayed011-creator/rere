using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Samsary.Api.Data;
using Samsary.Api.DTOs;
using Samsary.Api.Models;
using Samsary.Api.Services;

namespace Samsary.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IJwtTokenService _jwt;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtTokenService jwt,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwt = jwt;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
    {
        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing is not null) return Conflict(new { error = "Email already registered." });

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            DisplayName = dto.DisplayName,
            EmailConfirmed = true
        };
        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        await _userManager.AddToRoleAsync(user, SeedData.UserRole);
        _logger.LogInformation("User registered {Email}", dto.Email);
        return await IssueAsync(user);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user is null || user.IsBlocked) return Unauthorized(new { error = "Invalid credentials." });

        var check = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: true);
        if (!check.Succeeded) return Unauthorized(new { error = "Invalid credentials." });

        return await IssueAsync(user);
    }

    private async Task<ActionResult<AuthResponseDto>> IssueAsync(ApplicationUser user)
    {
        var (token, exp) = await _jwt.CreateTokenAsync(user);
        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new AuthResponseDto(token, exp,
            new UserDto(user.Id, user.Email ?? "", user.DisplayName, user.AvatarUrl, user.Bio, roles)));
    }
}
