using Samsary.Application.Common.Messaging;
using Samsary.Application.Common.Results;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Categories.Specifications;
using Samsary.Domain.Repositories;

namespace Samsary.Application.Features.Categories.Queries;

public sealed record GetCategoriesQuery : IQuery<Result<IReadOnlyList<CategoryDto>>>;

public sealed class GetCategoriesQueryHandler : IQueryHandler<GetCategoriesQuery, IReadOnlyList<CategoryDto>>
{
    private readonly ICategoryRepository _categories;

    public GetCategoriesQueryHandler(ICategoryRepository categories) => _categories = categories;

    public async Task<Result<IReadOnlyList<CategoryDto>>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var categories = await _categories.ListAsync(new AllCategoriesSpecification(), cancellationToken);
        IReadOnlyList<CategoryDto> dtos = categories
            .Select(c => new CategoryDto(c.Id, c.Name, c.NameAr, c.Slug, c.IconClass))
            .ToList();
        return Result.Success(dtos);
    }
}
