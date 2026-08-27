using FluentValidation.Results;

namespace Samsary.Application.Common.Exceptions;

/// <summary>Thrown when input validation fails. Carries a field-keyed error dictionary.</summary>
public class ValidationException : Exception
{
    public ValidationException()
        : base("One or more validation failures have occurred.")
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ValidationException(IEnumerable<ValidationFailure> failures) : this()
    {
        Errors = failures
            .GroupBy(e => e.PropertyName, e => e.ErrorMessage)
            .ToDictionary(g => g.Key, g => g.ToArray());
    }

    public ValidationException(IDictionary<string, string[]> errors) : this()
    {
        Errors = errors;
    }

    public IDictionary<string, string[]> Errors { get; }
}
