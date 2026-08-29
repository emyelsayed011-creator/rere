using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Samsary.Application.Common.Interfaces;
using Samsary.Infrastructure.Configuration;

namespace Samsary.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> options, ILogger<EmailService> logger)
    {
        _settings = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.SmtpHost))
        {
            // Dev mode — no SMTP host configured; print to log instead of sending
            _logger.LogInformation("[EmailDev] To={To} Subject={Subject}\n{Body}", toEmail, subject, htmlBody);
            return;
        }

        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        msg.To.Add(MailboxAddress.Parse(toEmail));
        msg.Subject = subject;
        msg.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort,
                _settings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None, ct);
            if (!string.IsNullOrEmpty(_settings.User))
                await client.AuthenticateAsync(_settings.User, _settings.Password, ct);
            await client.SendAsync(msg, ct);
            await client.DisconnectAsync(true, ct);
            _logger.LogInformation("Email sent to {To} subject={Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to send email to {To}. Host={Host} Port={Port} User={User} FromAddress={From}",
                toEmail, _settings.SmtpHost, _settings.SmtpPort, _settings.User, _settings.FromAddress);
            throw;
        }
    }
}
