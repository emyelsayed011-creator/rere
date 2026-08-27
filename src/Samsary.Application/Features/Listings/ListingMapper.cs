using Samsary.Application.DTOs;
using Samsary.Domain.Entities;

namespace Samsary.Application.Features.Listings;

/// <summary>Maps Listing aggregates to their API DTOs.</summary>
internal static class ListingMapper
{
    public static ListingDto ToDto(Listing l, bool isFavorited = false) => new(
        l.Id, l.Title, l.Description, l.Price, l.Currency, l.Type, l.Status, l.Location, l.RejectionReason,
        new CategoryDto(l.Category!.Id, l.Category.Name, l.Category.Slug, l.Category.IconClass),
        l.OwnerId, l.Owner?.DisplayName ?? "", l.Owner?.AvatarUrl,
        l.CreatedAt,
        l.Media.Select(ToMediaDto).ToList(),
        l.ViewCount,
        isFavorited);

    public static ListingMediaDto ToMediaDto(ListingMedia m) =>
        new(m.Id, m.Url, m.PublicId, m.MediaType, m.DurationSeconds, m.ThumbnailUrl);
}
