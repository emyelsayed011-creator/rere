using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Chat.Specifications;

/// <summary>
/// Returns all messages the user has sent or received, with Sender loaded.
/// Used to derive the conversation list (handlers group by the other party in memory).
/// </summary>
public sealed class UserConversationsSpecification : Specification<ChatMessage>
{
    public UserConversationsSpecification(string userId)
    {
        Where(m => m.SenderId == userId || m.ReceiverId == userId);
        AddInclude(m => m.Sender!);
        ApplyOrderByDescending(m => m.SentAt);
    }
}
