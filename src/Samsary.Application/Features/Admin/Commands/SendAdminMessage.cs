using FluentValidation;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Domain.Entities;
using Samsary.Domain.Enums;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Admin.Commands;

public sealed record SendAdminMessageCommand(string UserId, string Body) : ICommand;

public sealed class SendAdminMessageCommandValidator : AbstractValidator<SendAdminMessageCommand>
{
    public SendAdminMessageCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Body).NotEmpty().MaximumLength(2000);
    }
}

public sealed class SendAdminMessageCommandHandler : ICommandHandler<SendAdminMessageCommand>
{
    private readonly IChatMessageRepository _messages;
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notify;
    private readonly ICurrentUser _currentUser;

    public SendAdminMessageCommandHandler(
        IChatMessageRepository messages, IUnitOfWork unitOfWork, INotificationService notify, ICurrentUser currentUser)
    {
        _messages = messages;
        _unitOfWork = unitOfWork;
        _notify = notify;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(SendAdminMessageCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } adminId)
            return Error.Unauthorized("User.Unauthenticated", "Not authenticated.");

        _messages.Add(new ChatMessage { SenderId = adminId, ReceiverId = request.UserId, Body = request.Body });
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _notify.NotifyAsync(request.UserId, NotificationType.Admin,
            "Message from admin", request.Body, $"/chat/{adminId}",
            NotificationChannel.InApp | NotificationChannel.Email,
            $"<p>{request.Body}</p>", ct: cancellationToken);

        return Result.Success();
    }
}
