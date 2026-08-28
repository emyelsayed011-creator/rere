using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Models;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Admin.Specifications;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Admin.Queries;

public sealed record GetSystemLogsQuery(int Page, int PageSize, string? Level) : IQuery<Result<PagedResult<SystemLogDto>>>;

public sealed class GetSystemLogsQueryHandler : IQueryHandler<GetSystemLogsQuery, PagedResult<SystemLogDto>>
{
    private readonly ISystemLogRepository _logs;

    public GetSystemLogsQueryHandler(ISystemLogRepository logs) => _logs = logs;

    public async Task<Result<PagedResult<SystemLogDto>>> Handle(GetSystemLogsQuery request, CancellationToken cancellationToken)
    {
        var pageSize = Math.Clamp(request.PageSize, 1, 200);
        var page = Math.Max(request.Page, 1);

        var total = await _logs.CountAsync(new SystemLogsSpecification(page, pageSize, request.Level, forCounting: true), cancellationToken);
        var items = await _logs.ListAsync(new SystemLogsSpecification(page, pageSize, request.Level), cancellationToken);

        var dtos = items
            .Select(l => new SystemLogDto(l.Id, l.Level, l.Source, l.Message, l.UserId, l.IpAddress,
                l.Path, l.Method, l.StatusCode, l.Exception, l.CreatedAt))
            .ToList();

        return new PagedResult<SystemLogDto>(dtos, total, page, pageSize);
    }
}
