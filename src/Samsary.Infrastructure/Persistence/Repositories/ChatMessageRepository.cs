using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Infrastructure.Persistence.Repositories;

public sealed class ChatMessageRepository : Repository<ChatMessage>, IChatMessageRepository
{
    public ChatMessageRepository(ApplicationDbContext db) : base(db) { }
}
