using Asp.Versioning;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Samsary.Api.ExceptionHandling;
using Samsary.Api.Middleware;
using Samsary.Application;
using Samsary.Infrastructure;
using Samsary.Infrastructure.Hubs;
using Samsary.Infrastructure.Persistence;
using Serilog;
using Wolverine;
using Wolverine.Postgresql;
using Wolverine.EntityFrameworkCore;
using Oakton.Resources;
using System.Globalization;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, lc) =>
{
    lc.ReadFrom.Configuration(ctx.Configuration)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File("Logs/samsary-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 14);

    var seqUrl = ctx.Configuration["Seq:ServerUrl"];
    if (!string.IsNullOrWhiteSpace(seqUrl))
    {
        lc.WriteTo.Seq(seqUrl, apiKey: ctx.Configuration["Seq:ApiKey"]);
    }
});

// ── OpenTelemetry ─────────────────────────────────────────────────────────────
builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService("Samsary.Api"))
    .WithTracing(tracing =>
    {
        tracing
            .AddAspNetCoreInstrumentation(o => o.RecordException = true)
            .AddHttpClientInstrumentation();

        var otlpEndpoint = builder.Configuration["OpenTelemetry:OtlpEndpoint"];
        if (!string.IsNullOrWhiteSpace(otlpEndpoint))
            tracing.AddOtlpExporter(o => o.Endpoint = new Uri(otlpEndpoint));
    });

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// ── Output cache (in-memory; swap for Redis store when running multiple instances) ─
// Note: swap AddOutputCache() for builder.Services.AddStackExchangeRedisOutputCache(...)
// when a Redis connection string is configured and multi-instance deployment is needed.
builder.Services.AddOutputCache();

// ── Wolverine (durable messaging + transactional outbox on PostgreSQL) ─────────
var wolverineConn = builder.Configuration.GetConnectionString("Default")!;
builder.Host.UseWolverine(opts =>
{
    opts.PersistMessagesWithPostgresql(wolverineConn, "wolverine");
    opts.UseEntityFrameworkCoreTransactions();
    opts.Policies.AutoApplyTransactions();
    opts.Policies.UseDurableLocalQueues();
    opts.Discovery.IncludeAssembly(typeof(Samsary.Infrastructure.DependencyInjection).Assembly);
});
builder.Services.AddResourceSetupOnStartup();

const string AngularCors = "AngularCors";
builder.Services.AddCors(o => o.AddPolicy(AngularCors, p => p
    .WithOrigins("http://localhost:4200", "https://localhost:4200")
    .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

// ── Permission-based policies for moderator access ────────────────────────────
builder.Services.AddAuthorization(options =>
{
    foreach (var perm in Enum.GetValues<Samsary.Domain.Enums.ModeratorPermission>())
    {
        if (perm == Samsary.Domain.Enums.ModeratorPermission.None) continue;
        var captured = perm;
        options.AddPolicy($"Permission:{(int)perm}", policy =>
            policy.RequireAssertion(ctx =>
                ctx.User.IsInRole(Samsary.Infrastructure.Persistence.SeedData.AdminRole) ||
                (ctx.User.IsInRole(Samsary.Infrastructure.Persistence.SeedData.ModeratorRole) &&
                 int.TryParse(ctx.User.FindFirst("mod_permissions")?.Value, out var bits) &&
                 ((Samsary.Domain.Enums.ModeratorPermission)bits).HasFlag(captured))));
    }
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");
var supportedCultures = new[] { new CultureInfo("en"), new CultureInfo("ar") };
builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    options.DefaultRequestCulture = new RequestCulture("en");
    options.SupportedCultures = supportedCultures;
    options.SupportedUICultures = supportedCultures;
    options.ApplyCurrentCultureToResponseHeaders = true;
});

builder.Services
    .AddApiVersioning(options =>
    {
        options.DefaultApiVersion = new ApiVersion(1, 0);
        options.AssumeDefaultVersionWhenUnspecified = true;
        options.ReportApiVersions = true;
        options.ApiVersionReader = ApiVersionReader.Combine(
            new HeaderApiVersionReader("X-Api-Version"),
            new QueryStringApiVersionReader("api-version"));
    })
    .AddApiExplorer(options =>
    {
        options.GroupNameFormat = "'v'VVV";
        options.SubstituteApiVersionInUrl = false;
    });

// ── Rate limiting ─────────────────────────────────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Auth endpoints: 10 req/min (brute-force protection).
    options.AddFixedWindowLimiter("auth", o =>
    {
        o.Window = TimeSpan.FromMinutes(1);
        o.PermitLimit = 10;
        o.QueueLimit = 0;
    });

    // General API: 120 req/min per IP (prevents scraping/abuse).
    options.AddSlidingWindowLimiter("api", o =>
    {
        o.Window = TimeSpan.FromMinutes(1);
        o.PermitLimit = 120;
        o.SegmentsPerWindow = 6;
        o.QueueLimit = 0;
    });

    // Media uploads: 20 req/hour per IP (prevents storage abuse).
    options.AddFixedWindowLimiter("media-upload", o =>
    {
        o.Window = TimeSpan.FromHours(1);
        o.PermitLimit = 20;
        o.QueueLimit = 0;
    });

    // Listing creation: 30 req/hour per IP.
    options.AddFixedWindowLimiter("listing-create", o =>
    {
        o.Window = TimeSpan.FromHours(1);
        o.PermitLimit = 30;
        o.QueueLimit = 0;
    });
});

// ── Health checks ─────────────────────────────────────────────────────────────
var healthChecks = builder.Services
    .AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>();

// Redis health check requires AspNetCore.HealthChecks.Redis — skipped; the output cache
// degrades gracefully to in-memory if Redis is unavailable.

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails(options =>
    options.CustomizeProblemDetails = ctx =>
    {
        ctx.ProblemDetails.Instance = ctx.HttpContext.Request.Path;
        ctx.ProblemDetails.Extensions["traceId"] = ctx.HttpContext.TraceIdentifier;
    });

builder.Services.Configure<FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 200L * 1024 * 1024;
});
builder.WebHost.ConfigureKestrel(o =>
{
    o.Limits.MaxRequestBodySize = 200L * 1024 * 1024;
    o.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(10);
    o.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(10);
});

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseSerilogRequestLogging();
app.UseRequestLocalization();
app.UseHttpsRedirection();
app.UseCors(AngularCors);
app.UseRateLimiter();
app.UseOutputCache();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<RequestLoggingMiddleware>();


app.MapControllers();
app.MapHealthChecks("/health");
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<NotificationHub>("/hubs/notifications");

try
{
    await SeedData.RunAsync(app.Services, app.Configuration);
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Seed/Migration failed");
}

app.Run();

