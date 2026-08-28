using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Theme;

// ── Get ───────────────────────────────────────────────────────────────────────

public sealed record GetThemeQuery : IQuery<Result<ThemeSettingsDto>>;

public sealed class GetThemeQueryHandler : IQueryHandler<GetThemeQuery, ThemeSettingsDto>
{
    private readonly IApplicationDbContext _db;
    public GetThemeQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<Result<ThemeSettingsDto>> Handle(GetThemeQuery _, CancellationToken ct)
    {
        var t = await _db.ThemeSettings.FirstOrDefaultAsync(ct)
                ?? new ThemeSettings();
        return new ThemeSettingsDto(t.PrimaryColor, t.AccentColor, t.LogoUrl, t.SiteName, t.FontFamily, t.FontSizeBase);
    }
}

// ── Update ────────────────────────────────────────────────────────────────────

public sealed record UpdateThemeCommand(
    string PrimaryColor, string AccentColor, string? LogoUrl,
    string? SiteName, string FontFamily, int FontSizeBase)
    : ICommand<Result<ThemeSettingsDto>>;

public sealed class UpdateThemeCommandValidator : AbstractValidator<UpdateThemeCommand>
{
    public UpdateThemeCommandValidator()
    {
        RuleFor(x => x.PrimaryColor).NotEmpty().Matches(@"^#[0-9a-fA-F]{6}$").WithMessage("Must be a hex color e.g. #1a4f7a");
        RuleFor(x => x.AccentColor).NotEmpty().Matches(@"^#[0-9a-fA-F]{6}$").WithMessage("Must be a hex color");
        RuleFor(x => x.FontFamily).NotEmpty().MaximumLength(50);
        RuleFor(x => x.FontSizeBase).InclusiveBetween(12, 24);
    }
}

public sealed class UpdateThemeCommandHandler : ICommandHandler<UpdateThemeCommand, ThemeSettingsDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IUnitOfWork _uow;
    public UpdateThemeCommandHandler(IApplicationDbContext db, IUnitOfWork uow) { _db = db; _uow = uow; }

    public async Task<Result<ThemeSettingsDto>> Handle(UpdateThemeCommand r, CancellationToken ct)
    {
        var theme = await _db.ThemeSettings.FirstOrDefaultAsync(ct);
        if (theme is null)
        {
            theme = new ThemeSettings { Id = 1 };
            _db.ThemeSettings.Add(theme);
        }

        theme.PrimaryColor = r.PrimaryColor;
        theme.AccentColor  = r.AccentColor;
        theme.LogoUrl      = r.LogoUrl;
        theme.SiteName     = r.SiteName;
        theme.FontFamily   = r.FontFamily;
        theme.FontSizeBase = r.FontSizeBase;
        theme.UpdatedAt    = DateTime.UtcNow;

        await _uow.SaveChangesAsync(ct);
        return ToDto(theme);
    }

    private static ThemeSettingsDto ToDto(ThemeSettings t) => new(
        t.PrimaryColor, t.AccentColor, t.LogoUrl, t.SiteName, t.FontFamily, t.FontSizeBase);
}
