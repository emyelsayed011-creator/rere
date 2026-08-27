using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.Features.Users.Specifications;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Admin.Commands;

public sealed record SetUserBlockedCommand(string UserId, bool Blocked) : ICommand;

public sealed class SetUserBlockedCommandHandler : ICommandHandler<SetUserBlockedCommand>
{
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _unitOfWork;

    public SetUserBlockedCommandHandler(IUserRepository users, IUnitOfWork unitOfWork)
    {
        _users = users;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(SetUserBlockedCommand request, CancellationToken cancellationToken)
    {
        var user = await _users.FirstOrDefaultAsync(new UserByIdSpecification(request.UserId), cancellationToken);
        if (user is null)
            return Error.NotFound("User.NotFound", $"User {request.UserId} was not found.");

        user.IsBlocked = request.Blocked;
        _users.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
