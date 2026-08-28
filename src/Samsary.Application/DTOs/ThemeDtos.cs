namespace Samsary.Application.DTOs;

public record ThemeSettingsDto(
    string PrimaryColor,
    string AccentColor,
    string? LogoUrl,
    string? SiteName,
    string FontFamily,
    int FontSizeBase);

public record UpdateThemeDto(
    string PrimaryColor,
    string AccentColor,
    string? LogoUrl,
    string? SiteName,
    string FontFamily,
    int FontSizeBase);
