using System.Diagnostics;
using Samsary.Api.Data;
using Samsary.Api.Models;

namespace Samsary.Api.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext ctx, ApplicationDbContext db)
    {
        var sw = Stopwatch.StartNew();
        Exception? caught = null;
        try { await _next(ctx); }
        catch (Exception ex) { caught = ex; throw; }
        finally
        {
            sw.Stop();
            try
            {
                if (caught is not null || ctx.Response.StatusCode >= 400 ||
                    ctx.Request.Path.StartsWithSegments("/api"))
                {
                    db.SystemLogs.Add(new SystemLog
                    {
                        Level = caught is not null ? "Error" :
                                (ctx.Response.StatusCode >= 500 ? "Error" :
                                 ctx.Response.StatusCode >= 400 ? "Warning" : "Info"),
                        Source = "Http",
                        Message = $"{ctx.Request.Method} {ctx.Request.Path} -> {ctx.Response.StatusCode} ({sw.ElapsedMilliseconds}ms)",
                        UserId = ctx.User?.Identity?.IsAuthenticated == true ? ctx.User.Identity.Name : null,
                        IpAddress = ctx.Connection.RemoteIpAddress?.ToString(),
                        Path = ctx.Request.Path,
                        Method = ctx.Request.Method,
                        StatusCode = ctx.Response.StatusCode,
                        Exception = caught?.ToString()
                    });
                    await db.SaveChangesAsync();
                }
            }
            catch (Exception logEx)
            {
                _logger.LogError(logEx, "Failed to write system log");
            }
        }
    }
}
