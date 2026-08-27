namespace Samsary.Application.Common.Exceptions;

/// <summary>Thrown when a request conflicts with the current state (e.g. duplicate resource).</summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}
