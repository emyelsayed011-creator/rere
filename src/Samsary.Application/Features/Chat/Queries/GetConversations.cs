using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Chat.Specifications;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Chat.Queries;

public sealed record GetConversationsQuery : IQuery<Result<IReadOnlyList<ConversationDto>>>;

public sealed class GetConversationsQueryHandler : IQueryHandler<GetConversationsQuery, IReadOnlyList<ConversationDto>>
{
    private readonly IChatMessageRepository _messages;
    private readonly IUserRepository _users;
    private readonly ICurrentUser _currentUser;

    public GetConversationsQueryHandler(IChatMessageRepository messages, IUserRepository users, ICurrentUser currentUser)
    {
        _messages = messages;
        _users = users;
        _currentUser = currentUser;
    }

    public async Task<Result<IReadOnlyList<ConversationDto>>> Handle(GetConversationsQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } me)
            return Error.Unauthorized("User.Unauthenticated", "Not authenticated.");

        var messages = await _messages.ListAsync(new UserConversationsSpecification(me), cancellationToken);

        var groups = messages
            .GroupBy(m => m.SenderId == me ? m.ReceiverId : m.SenderId)
            .Select(g => new
            {
                OtherId = g.Key,
                Last = g.First(),
                Unread = g.Count(m => m.ReceiverId == me && !m.IsRead)
            })
            .ToList();

        var users = (await _users.GetByIdsAsync(groups.Select(g => g.OtherId), cancellationToken))
            .ToDictionary(u => u.Id);

        IReadOnlyList<ConversationDto> dtos = groups.Select(g =>
        {
            users.TryGetValue(g.OtherId, out var u);
            return new ConversationDto(g.OtherId,
                u?.DisplayName ?? u?.UserName ?? "Unknown",
                u?.AvatarUrl,
                g.Last.Body, g.Last.SentAt, g.Unread);
        }).ToList();

        return Result.Success(dtos);
    }
}
