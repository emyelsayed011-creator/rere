using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Admin.Specifications;
using Samsary.Application.Features.Listings.Specifications;
using Samsary.Domain.Entities;
using Samsary.Domain.Enums;
using Samsary.Domain.Repositories;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Admin.Queries;

public sealed record GetDashboardQuery : IQuery<Result<DashboardDto>>;

public sealed class GetDashboardQueryHandler : IQueryHandler<GetDashboardQuery, DashboardDto>
{
    private readonly IUserRepository _users;
    private readonly IListingRepository _listings;
    private readonly IChatMessageRepository _messages;
    private readonly INotificationRepository _notifications;

    public GetDashboardQueryHandler(
        IUserRepository users, IListingRepository listings,
        IChatMessageRepository messages, INotificationRepository notifications)
    {
        _users = users;
        _listings = listings;
        _messages = messages;
        _notifications = notifications;
    }

    public async Task<Result<DashboardDto>> Handle(GetDashboardQuery request, CancellationToken cancellationToken) =>
        new DashboardDto(
            await _users.CountAsync(new EmptySpecification<ApplicationUser>(), cancellationToken),
            await _users.CountAsync(new BlockedUsersCountSpecification(), cancellationToken),
            await _listings.CountAsync(new ListingsCountSpecification(), cancellationToken),
            await _listings.CountAsync(new ListingsCountSpecification(ListingStatus.Pending), cancellationToken),
            await _listings.CountAsync(new ListingsCountSpecification(ListingStatus.Approved), cancellationToken),
            await _listings.CountAsync(new ListingsCountSpecification(ListingStatus.Rejected), cancellationToken),
            await _messages.CountAsync(new EmptySpecification<ChatMessage>(), cancellationToken),
            await _notifications.CountAsync(new EmptySpecification<Notification>(), cancellationToken));
}
