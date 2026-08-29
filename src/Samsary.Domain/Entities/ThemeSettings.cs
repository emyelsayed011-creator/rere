using System.ComponentModel.DataAnnotations;

namespace Samsary.Domain.Entities;

/// <summary>Singleton row — always Id = 1. Stores visual branding applied at runtime.</summary>
public class ThemeSettings
{
    public int Id { get; set; } = 1;

    [MaxLength(7)]  public string PrimaryColor  { get; set; } = "#1a4f7a";
    [MaxLength(7)]  public string AccentColor   { get; set; } = "#c9991f";
    [MaxLength(200)] public string? LogoUrl     { get; set; }
    [MaxLength(80)]  public string? SiteName    { get; set; }
    [MaxLength(80)]  public string? SiteNameAr  { get; set; }
    [MaxLength(50)]  public string FontFamily   { get; set; } = "Poppins";
    public int FontSizeBase { get; set; } = 16;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
