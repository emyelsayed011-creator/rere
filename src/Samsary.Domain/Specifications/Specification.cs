using System.Linq.Expressions;

namespace Samsary.Domain.Specifications;

/// <summary>Base class providing a fluent, protected API for building an <see cref="ISpecification{T}"/>.</summary>
public abstract class Specification<T> : ISpecification<T>
{
    private readonly List<Expression<Func<T, bool>>> _criteria = [];
    private readonly List<Expression<Func<T, object>>> _includes = [];

    public IReadOnlyList<Expression<Func<T, bool>>> Criteria => _criteria;
    public IReadOnlyList<Expression<Func<T, object>>> Includes => _includes;
    public Expression<Func<T, object>>? OrderBy { get; private set; }
    public Expression<Func<T, object>>? OrderByDescending { get; private set; }
    public int? Skip { get; private set; }
    public int? Take { get; private set; }
    public bool IsPagingEnabled { get; private set; }

    protected void Where(Expression<Func<T, bool>> criteria) => _criteria.Add(criteria);

    protected void AddInclude(Expression<Func<T, object>> include) => _includes.Add(include);

    protected void ApplyOrderBy(Expression<Func<T, object>> orderBy) => OrderBy = orderBy;

    protected void ApplyOrderByDescending(Expression<Func<T, object>> orderByDescending) =>
        OrderByDescending = orderByDescending;

    protected void ApplyPaging(int skip, int take)
    {
        Skip = skip;
        Take = take;
        IsPagingEnabled = true;
    }
}
