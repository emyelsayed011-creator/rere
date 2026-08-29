using MediatR;
using Microsoft.AspNetCore.Mvc;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Auth.Commands;

namespace Samsary.Api.Controllers;

[Route("api/auth")]
public class AuthController : ApiControllerBase
{
    private readonly ISender _sender;

    public AuthController(ISender sender) => _sender = sender;

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto, CancellationToken ct)
        => HandleResult(
            await _sender.Send(new RegisterCommand(dto.Email, dto.Password, dto.DisplayName, dto.Phone), ct),
            created => CreatedAtAction(nameof(Register), created));

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(new LoginCommand(dto.Email, dto.Password), ct));

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] string refreshToken, CancellationToken ct)
        => HandleResult(await _sender.Send(new RefreshTokenCommand(refreshToken), ct));

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] string refreshToken, CancellationToken ct)
        => HandleResult(await _sender.Send(new LogoutCommand(refreshToken), ct));

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] string email, CancellationToken ct)
        => HandleResult(await _sender.Send(new ForgotPasswordCommand(email), ct));

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(new ResetPasswordCommand(dto.Email, dto.Token, dto.NewPassword), ct));

    [HttpPost("confirm-email")]
    public async Task<IActionResult> ConfirmEmail(ConfirmEmailDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(new ConfirmEmailCommand(dto.UserId, dto.Token), ct));
}
