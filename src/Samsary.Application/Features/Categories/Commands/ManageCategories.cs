using FluentValidation;
using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Categories.Specifications;
using Samsary.Domain.Entities;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Categories.Commands;

// ── Create ────────────────────────────────────────────────────────────────────

public sealed record CreateCategoryCommand(string Name, string? NameAr, string Slug, string? IconClass)
    : ICommand<Result<CategoryDto>>;

public sealed class CreateCategoryCommandValidator : AbstractValidator<CreateCategoryCommand>
{
    public CreateCategoryCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(100).Matches(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")
            .WithMessage("Slug must be lowercase letters, numbers, and hyphens only.");
    }
}

public sealed class CreateCategoryCommandHandler : ICommandHandler<CreateCategoryCommand, CategoryDto>
{
    private readonly ICategoryRepository _categories;
    private readonly IUnitOfWork _unitOfWork;

    public CreateCategoryCommandHandler(ICategoryRepository categories, IUnitOfWork unitOfWork)
    {
        _categories = categories;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CategoryDto>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        if (await _categories.AnyAsync(new CategoryBySlugSpecification(request.Slug), cancellationToken))
            return Error.Conflict("Category.SlugExists", $"Slug '{request.Slug}' is already in use.");

        var category = new Category
        {
            Name = request.Name.Trim(),
            NameAr = request.NameAr?.Trim(),
            Slug = request.Slug.Trim().ToLowerInvariant(),
            IconClass = request.IconClass?.Trim()
        };

        _categories.Add(category);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new CategoryDto(category.Id, category.Name, category.NameAr, category.Slug, category.IconClass);
    }
}

// ── Update ────────────────────────────────────────────────────────────────────

public sealed record UpdateCategoryCommand(int Id, string Name, string? NameAr, string Slug, string? IconClass)
    : ICommand<Result<CategoryDto>>;

public sealed class UpdateCategoryCommandValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(100).Matches(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")
            .WithMessage("Slug must be lowercase letters, numbers, and hyphens only.");
    }
}

public sealed class UpdateCategoryCommandHandler : ICommandHandler<UpdateCategoryCommand, CategoryDto>
{
    private readonly ICategoryRepository _categories;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateCategoryCommandHandler(ICategoryRepository categories, IUnitOfWork unitOfWork)
    {
        _categories = categories;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CategoryDto>> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _categories.FirstOrDefaultAsync(new CategoryByIdSpecification(request.Id), cancellationToken);
        if (category is null)
            return Error.NotFound("Category.NotFound", $"Category {request.Id} not found.");

        // Slug uniqueness check — ignore the current category's own slug.
        if (!string.Equals(category.Slug, request.Slug, StringComparison.OrdinalIgnoreCase) &&
            await _categories.AnyAsync(new CategoryBySlugSpecification(request.Slug), cancellationToken))
            return Error.Conflict("Category.SlugExists", $"Slug '{request.Slug}' is already in use.");

        category.Name = request.Name.Trim();
        category.NameAr = request.NameAr?.Trim();
        category.Slug = request.Slug.Trim().ToLowerInvariant();
        category.IconClass = request.IconClass?.Trim();

        _categories.Update(category);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new CategoryDto(category.Id, category.Name, category.NameAr, category.Slug, category.IconClass);
    }
}

// ── Delete ────────────────────────────────────────────────────────────────────

public sealed record DeleteCategoryCommand(int Id) : ICommand;

public sealed class DeleteCategoryCommandHandler : ICommandHandler<DeleteCategoryCommand>
{
    private readonly ICategoryRepository _categories;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteCategoryCommandHandler(ICategoryRepository categories, IUnitOfWork unitOfWork)
    {
        _categories = categories;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _categories.FirstOrDefaultAsync(new CategoryByIdSpecification(request.Id), cancellationToken);
        if (category is null)
            return Error.NotFound("Category.NotFound", $"Category {request.Id} not found.");

        // DB constraint will reject deletion if listings still reference this category.
        _categories.Remove(category);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
