using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Samsary.Application.Common.Models;
using Samsary.Application.DTOs;
using Samsary.Application.Services.Admin;
using Samsary.Infrastructure.Persistence;

namespace Samsary.Api.Controllers;

[ApiController]
[Authorize(Roles = SeedData.AdminRole)]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _admin;

    public AdminController(IAdminService admin) => _admin = admin;

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardDto>> Dashboard(CancellationToken ct)
        => Ok(await _admin.GetDashboardAsync(ct));

    [HttpGet("listings/pending")]
    public async Task<ActionResult<IReadOnlyList<PendingListingDto>>> Pending(CancellationToken ct)
        => Ok(await _admin.GetPendingListingsAsync(ct));

    [HttpPost("listings/{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, CancellationToken ct)
    {
        await _admin.ApproveListingAsync(id, ct);
        return Ok();
    }

    [HttpPost("listings/{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, RejectListingDto dto, CancellationToken ct)
    {
        await _admin.RejectListingAsync(id, dto, ct);
        return Ok();
    }

    [HttpGet("users")]
    public async Task<ActionResult<PagedResult<AdminUserDto>>> Users(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken ct = default)
        => Ok(await _admin.GetUsersAsync(page, pageSize, ct));

    [HttpPost("users/{id}/block")]
    public async Task<IActionResult> Block(string id, [FromQuery] bool block = true, CancellationToken ct = default)
    {
        await _admin.SetUserBlockedAsync(id, block, ct);
        return Ok();
    }

    [HttpPost("users/{id}/message")]
    public async Task<IActionResult> AdminMessage(string id, [FromBody] SendMessageDto dto, CancellationToken ct)
    {
        await _admin.SendMessageAsync(id, dto, ct);
        return Ok();
    }

    [HttpGet("logs")]
    public async Task<ActionResult<PagedResult<SystemLogDto>>> Logs(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? level = null,
        CancellationToken ct = default)
        => Ok(await _admin.GetLogsAsync(page, pageSize, level, ct));
}
