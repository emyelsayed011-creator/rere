using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Chat.Specifications;

/// <summary>
/// Returns the most recent <paramref name="take"/> messages exchanged between two specific users,
/// with the Sender loaded. Ordered newest-first by the repository; handlers reverse for display.
/// </summary>
public sealed class ChatThreadSpecification : Specification<ChatMessage>
{
    public ChatThreadSpecification(string userId, string otherId, int take)
    {
        Where(m => (m.SenderId == userId && m.ReceiverId == otherId)
                || (m.SenderId == otherId && m.ReceiverId == userId));
        AddInclude(m => m.Sender!);
        ApplyOrderByDescending(m => m.SentAt);
        ApplyPaging(0, take);
    }
}
