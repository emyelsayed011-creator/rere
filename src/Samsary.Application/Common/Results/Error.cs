namespace Samsary.Application.Common.Results;

/// <summary>Categorises a failure so the API layer can map it to the right HTTP status / ProblemDetails.</summary>
public enum ErrorType
{
    Failure = 0,
    Validation = 1,
    NotFound = 2,
    Conflict = 3,
    Unauthorized = 4,
    Forbidden = 5
}

/// <summary>A domain/application failure value used by <see cref="Result"/> instead of throwing exceptions for expected flows.</summary>
public record Error(string Code, string Description, ErrorType Type)
{
    public static readonly Error None = new(string.Empty, string.Empty, ErrorType.Failure);

    public static Error Failure(string code, string description) => new(code, description, ErrorType.Failure);
    public static Error NotFound(string code, string description) => new(code, description, ErrorType.NotFound);
    public static Error Conflict(string code, string description) => new(code, description, ErrorType.Conflict);
    public static Error Unauthorized(string code, string description) => new(code, description, ErrorType.Unauthorized);
    public static Error Forbidden(string code, string description) => new(code, description, ErrorType.Forbidden);

    public static ValidationError Validation(IDictionary<string, string[]> errors) => new(errors);
}

/// <summary>A validation failure that carries per-field error messages for RFC 7807 ValidationProblemDetails.</summary>
public sealed record ValidationError : Error
{
    public ValidationError(IDictionary<string, string[]> errors)
        : base("Validation.General", "One or more validation errors occurred.", ErrorType.Validation)
        => Errors = errors;

    public IDictionary<string, string[]> Errors { get; }
}
