namespace Samsary.Application.Common.Exceptions;

/// <summary>Thrown when the current user is not allowed to perform an action.</summary>
public class ForbiddenAccessException : Exception
{
    public ForbiddenAccessException(string message = "You are not allowed to perform this action.")
        : base(message) { }
}
