using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Categories.Specifications;

/// <summary>Finds a category by its unique slug.</summary>
public sealed class CategoryBySlugSpecification : Specification<Category>
{
    public CategoryBySlugSpecification(string slug) => Where(c => c.Slug == slug.ToLower());
}
