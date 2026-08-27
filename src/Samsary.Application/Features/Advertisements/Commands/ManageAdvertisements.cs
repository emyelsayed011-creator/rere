using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Advertisements.Commands;

internal static class AdMapper
{
    internal static AdvertisementDto ToDto(Advertisement a) => new(
        a.Id, a.Title, a.Description, a.ImageUrl, a.LinkUrl,
        a.Placement, a.IsActive, a.StartsAt, a.EndsAt, a.ImpressionCount, a.ClickCount,
        a.TargetAudience, a.TargetCountries, a.TargetGenders, a.TargetMinAge, a.TargetMaxAge, a.TargetLocations,
        a.ListingId,
        a.Listing?.Title,
        a.Listing?.Price,
        a.Listing?.Currency,
        a.Listing?.Location,
        a.Listing?.Media?.FirstOrDefault()?.ThumbnailUrl ?? a.Listing?.Media?.FirstOrDefault()?.Url);
}

// ── Create ──────────────────────────────────────────────────────────────────

public sealed record CreateAdvertisementCommand(
    string Title, string? Description, string ImageUrl, string? LinkUrl,
    string Placement, DateTime StartsAt, DateTime? EndsAt,
    int? ListingId = null,
    string TargetAudience = "all",
    string? TargetCountries = null, string? TargetGenders = null,
    int? TargetMinAge = null, int? TargetMaxAge = null, string? TargetLocations = null)
    : ICommand<Result<AdvertisementDto>>;

public sealed class CreateAdvertisementCommandValidator : AbstractValidator<CreateAdvertisementCommand>
{
    private static readonly string[] ValidPlacements = ["banner", "home-hero", "sidebar"];
    public CreateAdvertisementCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ImageUrl).NotEmpty().MaximumLength(500);
        RuleFor(x => x.LinkUrl).MaximumLength(500).When(x => x.LinkUrl is not null);
        RuleFor(x => x.Placement).NotEmpty().Must(p => ValidPlacements.Contains(p))
            .WithMessage("Placement must be one of: banner, home-hero, sidebar");
    }
}

public sealed class CreateAdvertisementCommandHandler : ICommandHandler<CreateAdvertisementCommand, AdvertisementDto>
{
    private readonly IAdvertisementRepository _ads;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _uow;

    public CreateAdvertisementCommandHandler(
        IAdvertisementRepository ads, ICurrentUser currentUser, IUnitOfWork uow)
    {
        _ads = ads; _currentUser = currentUser; _uow = uow;
    }

    public async Task<Result<AdvertisementDto>> Handle(CreateAdvertisementCommand r, CancellationToken ct)
    {
        var ad = new Advertisement
        {
            Title = r.Title, Description = r.Description, ImageUrl = r.ImageUrl,
            LinkUrl = r.LinkUrl, Placement = r.Placement,
            StartsAt = r.StartsAt, EndsAt = r.EndsAt,
            ListingId = r.ListingId,
            TargetAudience = r.TargetAudience,
            TargetCountries = r.TargetCountries,
            TargetGenders = r.TargetGenders,
            TargetMinAge = r.TargetMinAge, TargetMaxAge = r.TargetMaxAge,
            TargetLocations = r.TargetLocations,
            CreatedByUserId = _currentUser.UserId
        };
        _ads.Add(ad);
        await _uow.SaveChangesAsync(ct);
        return AdMapper.ToDto(ad);
    }
}

// ── Update ───────────────────────────────────────────────────────────────────

public sealed record UpdateAdvertisementCommand(
    int Id, string Title, string? Description, string ImageUrl, string? LinkUrl,
    string Placement, bool IsActive, DateTime StartsAt, DateTime? EndsAt,
    int? ListingId = null,
    string TargetAudience = "all",
    string? TargetCountries = null, string? TargetGenders = null,
    int? TargetMinAge = null, int? TargetMaxAge = null, string? TargetLocations = null)
    : ICommand<Result<AdvertisementDto>>;

public sealed class UpdateAdvertisementCommandHandler : ICommandHandler<UpdateAdvertisementCommand, AdvertisementDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IUnitOfWork _uow;

    public UpdateAdvertisementCommandHandler(IApplicationDbContext db, IUnitOfWork uow)
    {
        _db = db; _uow = uow;
    }

    public async Task<Result<AdvertisementDto>> Handle(UpdateAdvertisementCommand r, CancellationToken ct)
    {
        var ad = await _db.Advertisements.FindAsync([r.Id], ct);
        if (ad is null) return Error.NotFound("Ad.NotFound", "Advertisement not found.");
        ad.Title = r.Title; ad.Description = r.Description;
        ad.ImageUrl = r.ImageUrl; ad.LinkUrl = r.LinkUrl;
        ad.Placement = r.Placement; ad.IsActive = r.IsActive;
        ad.StartsAt = r.StartsAt; ad.EndsAt = r.EndsAt;
        ad.ListingId = r.ListingId;
        ad.TargetAudience = r.TargetAudience;
        ad.TargetCountries = r.TargetCountries; ad.TargetGenders = r.TargetGenders;
        ad.TargetMinAge = r.TargetMinAge; ad.TargetMaxAge = r.TargetMaxAge;
        ad.TargetLocations = r.TargetLocations;
        await _db.SaveChangesAsync(ct);
        return AdMapper.ToDto(ad);
    }
}

// ── Delete ───────────────────────────────────────────────────────────────────

public sealed record DeleteAdvertisementCommand(int Id) : ICommand;

public sealed class DeleteAdvertisementCommandHandler : ICommandHandler<DeleteAdvertisementCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IUnitOfWork _uow;

    public DeleteAdvertisementCommandHandler(IApplicationDbContext db, IUnitOfWork uow)
    {
        _db = db; _uow = uow;
    }

    public async Task<Result> Handle(DeleteAdvertisementCommand r, CancellationToken ct)
    {
        var ad = await _db.Advertisements.FindAsync([r.Id], ct);
        if (ad is null) return Error.NotFound("Ad.NotFound", "Advertisement not found.");
        _db.Advertisements.Remove(ad);
        await _db.SaveChangesAsync(ct);
        return Result.Success();
    }
}

// ── Track Click ──────────────────────────────────────────────────────────────

public sealed record TrackAdClickCommand(int AdId) : ICommand;

public sealed class TrackAdClickCommandHandler : ICommandHandler<TrackAdClickCommand>
{
    private readonly IApplicationDbContext _db;
    public TrackAdClickCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<Result> Handle(TrackAdClickCommand r, CancellationToken ct)
    {
        await _db.Advertisements.Where(a => a.Id == r.AdId)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.ClickCount, a => a.ClickCount + 1), ct);
        return Result.Success();
    }
}

