using System.Reflection;
using Samsary.Application.Common.Results;

namespace Samsary.Application.Common.Messaging;

/// <summary>
/// Builds a failed <typeparamref name="TResponse"/> (either <see cref="Result"/> or <see cref="Result{TValue}"/>)
/// from a validation error. Needed because pipeline behaviors are generic over the response type.
/// </summary>
internal static class ResultFactory
{
    public static TResponse ValidationFailure<TResponse>(IDictionary<string, string[]> errors)
        where TResponse : Result
    {
        var error = Error.Validation(errors);

        if (typeof(TResponse) == typeof(Result))
            return (TResponse)(object)Result.Failure(error);

        var valueType = typeof(TResponse).GetGenericArguments()[0];
        var closed = typeof(Result<>).MakeGenericType(valueType);
        var failure = closed.GetMethod(
            nameof(Result.Failure),
            BindingFlags.Public | BindingFlags.Static | BindingFlags.DeclaredOnly,
            binder: null,
            types: [typeof(Error)],
            modifiers: null)!;

        return (TResponse)failure.Invoke(null, [error])!;
    }
}
