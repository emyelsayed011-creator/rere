using Samsary.Domain.Entities;

namespace Samsary.Domain.Repositories;

/// <summary>
/// All queries are expressed via <see cref="IRepository{T}"/> specs defined in the Application layer.
/// </summary>
public interface ICategoryRepository : IRepository<Category> { }
