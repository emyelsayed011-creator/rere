using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Categories.Specifications;

/// <summary>Checks whether a category with the given id exists. Use with <c>AnyAsync</c>.</summary>
public sealed class CategoryByIdSpecification : Specification<Category>
{
    public CategoryByIdSpecification(int id) => Where(c => c.Id == id);
}
