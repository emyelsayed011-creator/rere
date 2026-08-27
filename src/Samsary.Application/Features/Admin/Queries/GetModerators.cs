using Microsoft.EntityFrameworkCore;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.Features.Admin.Commands;

namespace Samsary.Application.Features.Admin.Queries;

public sealed record GetModeratorsQuery : IQuery<Result<List<ModeratorDto>>>;

public sealed class GetModeratorsQueryHandler : IQueryHandler<GetModeratorsQuery, List<ModeratorDto>>
{
    private readonly IApplicationDbContext _db;

    public GetModeratorsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<Result<List<ModeratorDto>>> Handle(GetModeratorsQuery _, CancellationToken ct)
    {
        var list = await _db.ModeratorProfiles
            .Include(m => m.User)
            .Where(m => m.IsActive)
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new ModeratorDto(
                m.UserId,
                m.User.Email!,
                m.User.DisplayName,
                m.User.AvatarUrl,
                m.Permissions,
                m.CreatedAt,
                m.IsActive))
            .ToListAsync(ct);

        return list;
    }
}
