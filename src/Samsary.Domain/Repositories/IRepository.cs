using Samsary.Domain.Specifications;

namespace Samsary.Domain.Repositories;

/// <summary>
/// Generic repository contract. Reads are driven by <see cref="ISpecification{T}"/> so the
/// interface stays stable regardless of how many use-case-specific queries are added later.
/// Concrete specifications live in the Application layer and are passed in at the call site.
/// </summary>
public interface IRepository<T> where T : class
{
    Task<T?> FirstOrDefaultAsync(ISpecification<T> spec, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> ListAsync(ISpecification<T> spec, CancellationToken cancellationToken = default);
    Task<int> CountAsync(ISpecification<T> spec, CancellationToken cancellationToken = default);
    Task<bool> AnyAsync(ISpecification<T> spec, CancellationToken cancellationToken = default);

    void Add(T entity);
    void Update(T entity);
    void Remove(T entity);
}
