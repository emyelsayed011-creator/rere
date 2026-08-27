namespace Samsary.Application.Common.Exceptions;

/// <summary>Thrown when a requested resource does not exist.</summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }

    public NotFoundException(string name, object key)
        : base($"\"{name}\" ({key}) was not found.") { }
}
