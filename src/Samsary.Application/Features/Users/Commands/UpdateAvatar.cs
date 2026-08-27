using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;

namespace Samsary.Application.Features.Users.Commands;

public sealed record UpdateAvatarCommand(IUploadedFile File) : ICommand<Result<UserDto>>;

public sealed class UpdateAvatarCommandHandler : ICommandHandler<UpdateAvatarCommand, UserDto>
{
    private readonly IIdentityService _identity;
    private readonly ICloudinaryService _cloud;
    private readonly ICurrentUser _currentUser;

    public UpdateAvatarCommandHandler(IIdentityService identity, ICloudinaryService cloud, ICurrentUser currentUser)
    {
        _identity = identity;
        _cloud = cloud;
        _currentUser = currentUser;
    }

    public async Task<Result<UserDto>> Handle(UpdateAvatarCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId)
            return Error.Unauthorized("User.Unauthenticated", "Not authenticated.");

        if (request.File is null || request.File.Length == 0)
            return Error.Validation(new Dictionary<string, string[]> { ["File"] = ["No file was provided."] });

        var upload = await _cloud.UploadImageAsync(request.File, cancellationToken);
        return await _identity.SetAvatarAsync(userId, upload.Url, cancellationToken);
    }
}
