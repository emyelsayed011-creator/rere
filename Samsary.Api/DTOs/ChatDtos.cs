using System.ComponentModel.DataAnnotations;

namespace Samsary.Api.DTOs;

public record SendMessageDto(
    [Required] string ReceiverId,
    [Required, MaxLength(2000)] string Body,
    int? RelatedListingId);

public record ChatMessageDto(
    long Id,
    string SenderId,
    string SenderName,
    string ReceiverId,
    string Body,
    DateTime SentAt,
    bool IsRead,
    int? RelatedListingId);

public record ConversationDto(
    string OtherUserId,
    string OtherUserDisplayName,
    string? OtherUserAvatarUrl,
    string LastMessage,
    DateTime LastMessageAt,
    int UnreadCount);

public record NotificationDto(
    long Id, int Type, string Title, string Message, string? Link, bool IsRead, DateTime CreatedAt);
