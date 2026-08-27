using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Categories.Specifications;

/// <summary>Returns all categories ordered alphabetically by name.</summary>
public sealed class AllCategoriesSpecification : Specification<Category>
{
    public AllCategoriesSpecification() => ApplyOrderBy(c => c.Name);
}
