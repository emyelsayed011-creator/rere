using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Admin.Commands;
using Samsary.Application.Features.Admin.Queries;
using Samsary.Application.Features.Auth.Commands;
using Samsary.Domain.Enums;
using Samsary.Infrastructure.Persistence;

namespace Samsary.Api.Controllers;

[Authorize(Roles = SeedData.AdminRole)]
[Route("api/admin")]
public class AdminController : ApiControllerBase
{
    private readonly ISender _sender;

    public AdminController(ISender sender) => _sender = sender;

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken ct)
        => HandleResult(await _sender.Send(new GetDashboardQuery(), ct));

    [HttpGet("listings/pending")]
    public async Task<IActionResult> Pending(CancellationToken ct)
        => HandleResult(await _sender.Send(new GetPendingListingsQuery(), ct));

    [HttpPost("listings/{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, CancellationToken ct)
        => HandleResult(await _sender.Send(new ApproveListingCommand(id), ct));

    [HttpPost("listings/{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, RejectListingDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(new RejectListingCommand(id, dto.Reason), ct));

    [HttpPost("listings/create-for-user")]
    public async Task<IActionResult> CreateListingForUser(AdminCreateListingDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(
            new AdminCreateListingCommand(
                dto.OwnerId, dto.Title, dto.Description, dto.Price,
                dto.Currency, dto.Type, dto.CategoryId, dto.Location), ct));

    [HttpGet("users")]
    public async Task<IActionResult> Users(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken ct = default)
        => HandleResult(await _sender.Send(new GetAdminUsersQuery(page, pageSize), ct));

    [HttpPost("users/{id}/block")]
    public async Task<IActionResult> Block(string id, [FromQuery] bool block = true, CancellationToken ct = default)
        => HandleResult(await _sender.Send(new SetUserBlockedCommand(id, block), ct));

    [HttpPost("users/{id}/ban")]
    public async Task<IActionResult> Ban(string id, BanUserRequestDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(new BanUserCommand(id, dto.Reason, dto.DurationHours), ct));

    [HttpPost("users/{id}/unban")]
    public async Task<IActionResult> Unban(string id, CancellationToken ct)
        => HandleResult(await _sender.Send(new LiftBanCommand(id), ct));

    [HttpPost("users/{id}/message")]
    public async Task<IActionResult> AdminMessage(string id, AdminMessageBodyDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(new SendAdminMessageCommand(id, dto.Body), ct));

    [HttpGet("logs")]
    public async Task<IActionResult> Logs(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? level = null,
        CancellationToken ct = default)
        => HandleResult(await _sender.Send(new GetSystemLogsQuery(page, pageSize, level), ct));

    [HttpGet("moderators")]
    public async Task<IActionResult> GetModerators(CancellationToken ct)
        => HandleResult(await _sender.Send(new GetModeratorsQuery(), ct));

    [HttpPost("moderators")]
    public async Task<IActionResult> CreateModerator(CreateModeratorRequestDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(new CreateModeratorCommand(dto.UserId, (ModeratorPermission)dto.Permissions), ct));

    [HttpPut("moderators/{userId}")]
    public async Task<IActionResult> UpdateModerator(string userId, UpdateModeratorRequestDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(new UpdateModeratorPermissionsCommand(userId, (ModeratorPermission)dto.Permissions), ct));

    [HttpDelete("moderators/{userId}")]
    public async Task<IActionResult> RemoveModerator(string userId, CancellationToken ct)
        => HandleResult(await _sender.Send(new RemoveModeratorCommand(userId), ct));

    [HttpPost("users/create")]
    public async Task<IActionResult> CreateUser(AdminCreateUserDto dto, CancellationToken ct)
    {
        var result = await _sender.Send(
            new RegisterCommand(dto.Email, dto.Password, dto.DisplayName, dto.Phone), ct);
        if (!result.IsSuccess) return HandleResult(result);
        var user = result.Value!.User;
        return Ok(new { id = user.Id, email = user.Email, displayName = user.DisplayName });
    }

    [HttpPost("broadcast")]
    public async Task<IActionResult> Broadcast([FromBody] BroadcastDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(new BroadcastNotificationCommand(dto.Title, dto.Message, dto.SendEmail), ct));
}

public record BroadcastDto(string Title, string Message, bool SendEmail = false);
