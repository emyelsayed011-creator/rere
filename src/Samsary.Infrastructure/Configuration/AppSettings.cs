namespace Samsary.Infrastructure.Configuration;

public class JwtSettings
{
    public string Issuer { get; set; } = "Samsary";
    public string Audience { get; set; } = "SamsaryClient";
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 120;
    public int RefreshTokenDays { get; set; } = 30;
}

public class CloudinarySettings
{
    public string CloudName { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string ApiSecret { get; set; } = string.Empty;
    public double MaxVideoDurationSeconds { get; set; } = 300; // 5 minutes
}

public class EmailSettings
{
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string User { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = "no-reply@samsarly.com";
    public string FromName { get; set; } = "Samsarly";
    /// <summary>Public URL of the web app — used to build email deep-links.</summary>
    public string AppBaseUrl { get; set; } = "https://samsarly.com";
}

public class SmsSettings
{
    public string AccountSid { get; set; } = string.Empty;
    public string AuthToken { get; set; } = string.Empty;
    public string FromNumber { get; set; } = string.Empty;
}

public class RedisSettings
{
    public string ConnectionString { get; set; } = "localhost:6379";
}
