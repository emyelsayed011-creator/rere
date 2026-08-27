using Microsoft.EntityFrameworkCore;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Advertisements.Commands;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Advertisements.Queries;

// ── Public: get active ads for a placement ───────────────────────────────────

public sealed record GetActiveAdsQuery(string Placement) : IQuery<Result<IReadOnlyList<AdvertisementDto>>>;

public sealed class GetActiveAdsQueryHandler : IQueryHandler<GetActiveAdsQuery, IReadOnlyList<AdvertisementDto>>
{
    private readonly IAdvertisementRepository _ads;
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetActiveAdsQueryHandler(IAdvertisementRepository ads, IApplicationDbContext db, ICurrentUser currentUser)
    {
        _ads = ads; _db = db; _currentUser = currentUser;
    }

    public async Task<Result<IReadOnlyList<AdvertisementDto>>> Handle(GetActiveAdsQuery r, CancellationToken ct)
    {
        // Resolve visitor demographics for targeting.
        string? country = null, gender = null, location = null;
        int? age = null;

        if (_currentUser.IsAuthenticated && _currentUser.UserId is { } uid)
        {
            var user = await _db.Users
                .Where(u => u.Id == uid)
                .Select(u => new { u.Country, u.Gender, u.DateOfBirth })
                .FirstOrDefaultAsync(ct);

            if (user is not null)
            {
                country = user.Country;
                gender = user.Gender;
                if (user.DateOfBirth.HasValue)
                    age = (int)((DateTime.UtcNow - user.DateOfBirth.Value).TotalDays / 365.25);
            }
        }

        var ads = await _ads.GetActiveAsync(r.Placement, country, gender, age, location, ct);
        IReadOnlyList<AdvertisementDto> dtos = ads.Select(AdMapper.ToDto).ToList();
        return Result.Success(dtos);
    }
}

// ── Admin: list all ads ───────────────────────────────────────────────────────

public sealed record GetAllAdsQuery : IQuery<Result<IReadOnlyList<AdvertisementDto>>>;

public sealed class GetAllAdsQueryHandler : IQueryHandler<GetAllAdsQuery, IReadOnlyList<AdvertisementDto>>
{
    private readonly IApplicationDbContext _db;
    public GetAllAdsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<Result<IReadOnlyList<AdvertisementDto>>> Handle(GetAllAdsQuery r, CancellationToken ct)
    {
        var ads = await _db.Advertisements
            .Include(a => a.Listing).ThenInclude(l => l!.Media)
            .OrderByDescending(a => a.CreatedAt).ToListAsync(ct);
        IReadOnlyList<AdvertisementDto> dtos = ads.Select(AdMapper.ToDto).ToList();
        return Result.Success(dtos);
    }
}
