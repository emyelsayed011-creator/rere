using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Models;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Admin.Specifications;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Admin.Queries;

public sealed record GetAdminUsersQuery(int Page, int PageSize) : IQuery<Result<PagedResult<AdminUserDto>>>;

public sealed class GetAdminUsersQueryHandler : IQueryHandler<GetAdminUsersQuery, PagedResult<AdminUserDto>>
{
    private readonly IUserRepository _users;

    public GetAdminUsersQueryHandler(IUserRepository users) => _users = users;

    public async Task<Result<PagedResult<AdminUserDto>>> Handle(GetAdminUsersQuery request, CancellationToken cancellationToken)
    {
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var page = Math.Max(request.Page, 1);

        var items = await _users.ListAsync(new PagedUsersSpecification(page, pageSize), cancellationToken);
        var total = await _users.CountAsync(new EmptySpecification<ApplicationUser>(), cancellationToken);

        var dtos = items
            .Select(u => new AdminUserDto(u.Id, u.Email, u.DisplayName, u.IsBlocked, u.CreatedAt))
            .ToList();

        return new PagedResult<AdminUserDto>(total, page, pageSize, dtos);
    }
}
