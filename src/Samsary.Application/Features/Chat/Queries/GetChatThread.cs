using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Chat.Specifications;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Chat.Queries;

public sealed record GetChatThreadQuery(string OtherId, int Take) : IQuery<Result<IReadOnlyList<ChatMessageDto>>>;

public sealed class GetChatThreadQueryHandler : IQueryHandler<GetChatThreadQuery, IReadOnlyList<ChatMessageDto>>
{
    private readonly IChatMessageRepository _messages;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;

    public GetChatThreadQueryHandler(IChatMessageRepository messages, IUnitOfWork unitOfWork, ICurrentUser currentUser)
    {
        _messages = messages;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Result<IReadOnlyList<ChatMessageDto>>> Handle(GetChatThreadQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } me)
            return Error.Unauthorized("User.Unauthenticated", "Not authenticated.");

        var take = Math.Clamp(request.Take, 1, 500);
        var messages = await _messages.ListAsync(new ChatThreadSpecification(me, request.OtherId, take), cancellationToken);

        var hadUnread = false;
        foreach (var m in messages.Where(x => x.ReceiverId == me && !x.IsRead))
        {
            m.IsRead = true;
            hadUnread = true;
        }
        if (hadUnread) await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Spec returns newest-first; sort ascending for chronological display.
        IReadOnlyList<ChatMessageDto> dtos = messages
            .OrderBy(m => m.SentAt)
            .Select(m => new ChatMessageDto(
                m.Id, m.SenderId, m.Sender?.DisplayName ?? m.Sender?.UserName ?? "", m.ReceiverId,
                m.Body, m.SentAt, m.IsRead, m.RelatedListingId))
            .ToList();

        return Result.Success(dtos);
    }
}
