namespace Samsary.Application.Common.Results;

/// <summary>Functional helpers (OnSuccess / OnFailure / Match / Map / Bind) for composing use-case results.</summary>
public static class ResultExtensions
{
    public static Result OnSuccess(this Result result, Action action)
    {
        if (result.IsSuccess) action();
        return result;
    }

    public static Result<TValue> OnSuccess<TValue>(this Result<TValue> result, Action<TValue> action)
    {
        if (result.IsSuccess) action(result.Value);
        return result;
    }

    public static async Task<Result<TValue>> OnSuccess<TValue>(this Result<TValue> result, Func<TValue, Task> action)
    {
        if (result.IsSuccess) await action(result.Value);
        return result;
    }

    public static Result OnFailure(this Result result, Action<Error> action)
    {
        if (result.IsFailure) action(result.Error);
        return result;
    }

    public static Result<TValue> OnFailure<TValue>(this Result<TValue> result, Action<Error> action)
    {
        if (result.IsFailure) action(result.Error);
        return result;
    }

    public static Result<TOut> Map<TIn, TOut>(this Result<TIn> result, Func<TIn, TOut> mapper) =>
        result.IsSuccess ? Result.Success(mapper(result.Value)) : Result.Failure<TOut>(result.Error);

    public static Result<TOut> Bind<TIn, TOut>(this Result<TIn> result, Func<TIn, Result<TOut>> binder) =>
        result.IsSuccess ? binder(result.Value) : Result.Failure<TOut>(result.Error);

    public static TOut Match<TOut>(this Result result, Func<TOut> onSuccess, Func<Error, TOut> onFailure) =>
        result.IsSuccess ? onSuccess() : onFailure(result.Error);

    public static TOut Match<TValue, TOut>(this Result<TValue> result, Func<TValue, TOut> onSuccess, Func<Error, TOut> onFailure) =>
        result.IsSuccess ? onSuccess(result.Value) : onFailure(result.Error);
}
