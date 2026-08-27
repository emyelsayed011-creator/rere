using Microsoft.EntityFrameworkCore;
using Samsary.Domain.Repositories;
using Samsary.Domain.Specifications;

namespace Samsary.Infrastructure.Persistence.Repositories;

/// <summary>
/// Generic EF Core repository. Delegates all reads through <see cref="SpecificationEvaluator"/>
/// so concrete repositories only need to add methods that cannot be expressed as a specification.
/// </summary>
public abstract class Repository<T> : IRepository<T> where T : class
{
    protected readonly ApplicationDbContext Db;

    protected Repository(ApplicationDbContext db) => Db = db;

    public async Task<T?> FirstOrDefaultAsync(ISpecification<T> spec, CancellationToken cancellationToken = default) =>
        await SpecificationEvaluator.GetQuery(Db.Set<T>(), spec).FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<T>> ListAsync(ISpecification<T> spec, CancellationToken cancellationToken = default) =>
        await SpecificationEvaluator.GetQuery(Db.Set<T>(), spec).ToListAsync(cancellationToken);

    public Task<int> CountAsync(ISpecification<T> spec, CancellationToken cancellationToken = default) =>
        SpecificationEvaluator.GetQuery(Db.Set<T>(), spec).CountAsync(cancellationToken);

    public Task<bool> AnyAsync(ISpecification<T> spec, CancellationToken cancellationToken = default) =>
        SpecificationEvaluator.GetQuery(Db.Set<T>(), spec).AnyAsync(cancellationToken);

    public void Add(T entity)    => Db.Set<T>().Add(entity);
    public void Update(T entity) => Db.Set<T>().Update(entity);
    public void Remove(T entity) => Db.Set<T>().Remove(entity);
}
