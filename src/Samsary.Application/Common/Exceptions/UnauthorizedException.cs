namespace Samsary.Application.Common.Exceptions;

/// <summary>Thrown when authentication fails (e.g. invalid credentials).</summary>
public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message = "Authentication failed.") : base(message) { }
}
