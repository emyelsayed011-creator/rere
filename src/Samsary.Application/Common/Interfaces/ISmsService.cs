namespace Samsary.Application.Common.Interfaces;

public interface ISmsService
{
    Task SendAsync(string toNumber, string message, CancellationToken ct = default);
}
