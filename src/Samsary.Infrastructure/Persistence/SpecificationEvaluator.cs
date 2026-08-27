using Microsoft.EntityFrameworkCore;
using Samsary.Domain.Specifications;

namespace Samsary.Infrastructure.Persistence;

/// <summary>Applies an <see cref="ISpecification{T}"/> to an <see cref="IQueryable{T}"/> using EF Core.</summary>
public static class SpecificationEvaluator
{
    public static IQueryable<T> GetQuery<T>(IQueryable<T> input, ISpecification<T> specification) where T : class
    {
        var query = input;

        foreach (var criteria in specification.Criteria)
        {
            query = query.Where(criteria);
        }

        query = specification.Includes.Aggregate(query, (current, include) => current.Include(include));

        if (specification.OrderBy is not null)
        {
            query = query.OrderBy(specification.OrderBy);
        }
        else if (specification.OrderByDescending is not null)
        {
            query = query.OrderByDescending(specification.OrderByDescending);
        }

        if (specification.IsPagingEnabled)
        {
            query = query.Skip(specification.Skip ?? 0).Take(specification.Take ?? int.MaxValue);
        }

        return query;
    }
}
