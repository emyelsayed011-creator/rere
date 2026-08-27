using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;

namespace Samsary.Application.Features.Users.Queries;

public sealed record GetCurrentUserQuery : IQuery<Result<UserDto>>;

public sealed class GetCurrentUserQueryHandler : IQueryHandler<GetCurrentUserQuery, UserDto>
{
    private readonly IIdentityService _identity;
    private readonly ICurrentUser _currentUser;

    public GetCurrentUserQueryHandler(IIdentityService identity, ICurrentUser currentUser)
    {
        _identity = identity;
        _currentUser = currentUser;
    }

    public Task<Result<UserDto>> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId)
            return Task.FromResult(Result.Failure<UserDto>(Error.Unauthorized("User.Unauthenticated", "Not authenticated.")));

        return _identity.GetByIdAsync(userId, cancellationToken);
    }
}
