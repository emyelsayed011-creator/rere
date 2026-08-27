namespace Samsary.Domain.Entities;

public class ChatMessage
{
    public long Id { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public ApplicationUser? Sender { get; set; }
    public string ReceiverId { get; set; } = string.Empty;
    public ApplicationUser? Receiver { get; set; }
    public string Body { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; }
    public int? RelatedListingId { get; set; }
}
