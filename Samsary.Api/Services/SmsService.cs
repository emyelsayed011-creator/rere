using Microsoft.Extensions.Options;
using Samsary.Api.Configuration;

namespace Samsary.Api.Services;

public interface ISmsService
{
    Task SendAsync(string toNumber, string message, CancellationToken ct = default);
}

public class SmsService : ISmsService
{
    private readonly SmsSettings _settings;
    private readonly ILogger<SmsService> _logger;

    public SmsService(IOptions<SmsSettings> options, ILogger<SmsService> logger)
    {
        _settings = options.Value;
        _logger = logger;
    }

    public Task SendAsync(string toNumber, string message, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.AccountSid))
        {
            _logger.LogInformation("[SmsDev] To={To} Msg={Msg}", toNumber, message);
            return Task.CompletedTask;
        }

        // Production integration intentionally omitted; plug Twilio SDK here using _settings.
        _logger.LogInformation("[SmsConfigured] To={To}", toNumber);
        return Task.CompletedTask;
    }
}
