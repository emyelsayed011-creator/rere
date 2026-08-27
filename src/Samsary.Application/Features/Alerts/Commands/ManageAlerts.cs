using FluentValidation;
using Samsary.Application.Common.Interfaces;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Alerts.Commands;

// ── Subscribe ────────────────────────────────────────────────────────────────

public sealed record SubscribeAlertCommand(int? CategoryId, string? Location) : ICommand<Result<ListingAlertDto>>;

public sealed class SubscribeAlertCommandValidator : AbstractValidator<SubscribeAlertCommand>
{
    public SubscribeAlertCommandValidator()
    {
        RuleFor(x => x.Location).MaximumLength(200).When(x => x.Location is not null);
        // At least one of CategoryId or Location must be set.
        RuleFor(x => x).Must(x => x.CategoryId.HasValue || !string.IsNullOrWhiteSpace(x.Location))
            .WithName("Alert")
            .WithMessage("Specify at least a category or a location to subscribe to.");
    }
}

public sealed class SubscribeAlertCommandHandler : ICommandHandler<SubscribeAlertCommand, ListingAlertDto>
{
    private readonly IListingAlertRepository _alerts;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _uow;

    public SubscribeAlertCommandHandler(IListingAlertRepository alerts, ICurrentUser currentUser, IUnitOfWork uow)
    {
        _alerts = alerts;
        _currentUser = currentUser;
        _uow = uow;
    }

    public async Task<Result<ListingAlertDto>> Handle(SubscribeAlertCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserIdRequired;

        var alert = new ListingAlert
        {
            UserId = userId,
            CategoryId = request.CategoryId,
            Location = request.Location?.Trim()
        };
        _alerts.Add(alert);
        await _uow.SaveChangesAsync(cancellationToken);

        return new ListingAlertDto(alert.Id, alert.CategoryId, null, alert.Location, alert.IsActive, alert.CreatedAt);
    }
}

// ── Unsubscribe ───────────────────────────────────────────────────────────────

public sealed record UnsubscribeAlertCommand(long AlertId) : ICommand;

public sealed class UnsubscribeAlertCommandHandler : ICommandHandler<UnsubscribeAlertCommand>
{
    private readonly IListingAlertRepository _alerts;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _uow;

    public UnsubscribeAlertCommandHandler(IListingAlertRepository alerts, ICurrentUser currentUser, IUnitOfWork uow)
    {
        _alerts = alerts;
        _currentUser = currentUser;
        _uow = uow;
    }

    public async Task<Result> Handle(UnsubscribeAlertCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserIdRequired;
        var alert = await _alerts.FirstOrDefaultAsync(
            new AlertByIdAndUserSpecification(request.AlertId, userId), cancellationToken);

        if (alert is null) return Error.NotFound("Alert.NotFound", "Alert not found.");
        _alerts.Remove(alert);
        await _uow.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
