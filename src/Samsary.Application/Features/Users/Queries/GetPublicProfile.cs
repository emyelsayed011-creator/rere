using Microsoft.EntityFrameworkCore;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Domain.Enums;

namespace Samsary.Application.Features.Users.Queries;

public sealed record PublicUserDto(
    string Id,
    string DisplayName,
    string? AvatarUrl,
    string? Bio,
    int ApprovedListingsCount,
    DateTime? MemberSince,
    string? Phone = null,
    string? Email = null,
    string? Country = null);

public sealed record GetPublicProfileQuery(string UserId) : IQuery<Result<PublicUserDto>>;

public sealed class GetPublicProfileQueryHandler : IQueryHandler<GetPublicProfileQuery, PublicUserDto>
{
    private readonly IApplicationDbContext _db;

    public GetPublicProfileQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<Result<PublicUserDto>> Handle(GetPublicProfileQuery request, CancellationToken cancellationToken)
    {
        var user = await _db.Users
            .Where(u => u.Id == request.UserId)
            .Select(u => new
            {
                u.Id, u.DisplayName, u.AvatarUrl, u.Bio, u.CreatedAt,
                u.PhoneNumber, u.Email, u.Country,
                ListingCount = u.Listings.Count(l => l.Status == ListingStatus.Approved)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
            return Error.NotFound("User.NotFound", "User not found.");

        return new PublicUserDto(user.Id, user.DisplayName ?? "", user.AvatarUrl, user.Bio,
            user.ListingCount, user.CreatedAt, user.PhoneNumber, user.Email, user.Country);
    }
}
