using System.Linq.Expressions;

namespace Samsary.Domain.Specifications;

/// <summary>
/// Encapsulates query criteria (filtering, includes, ordering, paging) so it can be composed and reused
/// independently of the persistence layer. Evaluated against an <c>IQueryable</c> in the Infrastructure layer.
/// </summary>
public interface ISpecification<T>
{
    /// <summary>Filter predicates, combined with logical AND.</summary>
    IReadOnlyList<Expression<Func<T, bool>>> Criteria { get; }

    /// <summary>Related navigation properties to eager-load.</summary>
    IReadOnlyList<Expression<Func<T, object>>> Includes { get; }

    Expression<Func<T, object>>? OrderBy { get; }

    Expression<Func<T, object>>? OrderByDescending { get; }

    int? Skip { get; }

    int? Take { get; }

    bool IsPagingEnabled { get; }
}
