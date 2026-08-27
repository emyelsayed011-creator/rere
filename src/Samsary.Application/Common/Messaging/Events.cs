namespace Samsary.Application.Common.Messaging;

/// <summary>
/// Integration events published to the Wolverine message bus. They are persisted in the
/// transactional outbox so handlers run reliably (with retries) after the originating DB
/// transaction commits — implementing the Outbox + Observer patterns.
/// </summary>

/// <summary>Raised when a chat message is saved. Subscribers: in-app push + delayed email.</summary>
public sealed record NewMessageEvent(string SenderId, string ReceiverId, string Preview);

/// <summary>Scheduled follow-up: send the message email only if it is still unread.</summary>
public sealed record MessageEmailReminder(string SenderId, string ReceiverId, string SenderName, string Preview);

/// <summary>Raised when a listing is approved. Subscriber: fan-out alerts to matching subscribers.</summary>
public sealed record ListingApprovedEvent(int ListingId);
