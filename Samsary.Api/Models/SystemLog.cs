namespace Samsary.Api.Models;

public class SystemLog
{
    public long Id { get; set; }
    public string Level { get; set; } = "Info";
    public string Source { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string? IpAddress { get; set; }
    public string? Path { get; set; }
    public string? Method { get; set; }
    public int? StatusCode { get; set; }
    public string? Exception { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
