using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Listings.Specifications;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Admin.Queries;

public sealed record GetPendingListingsQuery : IQuery<Result<IReadOnlyList<PendingListingDto>>>;

public sealed class GetPendingListingsQueryHandler : IQueryHandler<GetPendingListingsQuery, IReadOnlyList<PendingListingDto>>
{
    private readonly IListingRepository _listings;

    public GetPendingListingsQueryHandler(IListingRepository listings) => _listings = listings;

    public async Task<Result<IReadOnlyList<PendingListingDto>>> Handle(GetPendingListingsQuery request, CancellationToken cancellationToken)
    {
        var items = await _listings.ListAsync(new PendingListingsSpecification(), cancellationToken);

        IReadOnlyList<PendingListingDto> dtos = items.Select(l => new PendingListingDto(
            l.Id, l.Title, l.Description, l.Price, l.Currency, l.Type, l.Location, l.CreatedAt,
            new PendingListingCategoryDto(l.Category!.Id, l.Category.Name),
            new PendingListingOwnerDto(l.Owner!.Id, l.Owner.DisplayName, l.Owner.Email),
            l.Media.Select(m => new PendingListingMediaDto(m.Url, m.MediaType, m.ThumbnailUrl)).ToList()))
            .ToList();

        return Result.Success(dtos);
    }
}
