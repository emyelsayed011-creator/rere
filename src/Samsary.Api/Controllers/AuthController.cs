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
        => HandleResult(await _sender.Send(new RegisterCommand(dto.Email, dto.Password, dto.DisplayName), ct));

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(new LoginCommand(dto.Email, dto.Password), ct));
}
