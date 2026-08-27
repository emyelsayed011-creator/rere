using MediatR;
using Samsary.Application.Common.Results;

namespace Samsary.Application.Common.Messaging;

/// <summary>A write operation (use case that changes state).</summary>
public interface ICommand<out TResponse> : IRequest<TResponse> where TResponse : Result;

/// <summary>A write operation without a meaningful return value.</summary>
public interface ICommand : IRequest<Result>;

/// <summary>A read operation.</summary>
public interface IQuery<out TResponse> : IRequest<TResponse> where TResponse : Result;

/// <summary>Convenience handler for commands that return a non-generic <see cref="Result"/>.</summary>
public interface ICommandHandler<in TCommand> : IRequestHandler<TCommand, Result>
    where TCommand : ICommand;

/// <summary>Convenience handler for commands that return <see cref="Result{TResponse}"/>.</summary>
public interface ICommandHandler<in TCommand, TResponse> : IRequestHandler<TCommand, Result<TResponse>>
    where TCommand : ICommand<Result<TResponse>>;

/// <summary>Convenience handler for queries.</summary>
public interface IQueryHandler<in TQuery, TResponse> : IRequestHandler<TQuery, Result<TResponse>>
    where TQuery : IQuery<Result<TResponse>>;
