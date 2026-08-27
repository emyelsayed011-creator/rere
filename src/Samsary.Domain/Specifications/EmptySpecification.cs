namespace Samsary.Domain.Specifications;

/// <summary>
/// Matches all entities with no filters, ordering or paging.
/// Use with <c>CountAsync</c> to count every row, or <c>ListAsync</c> when you truly need all rows.
/// </summary>
public sealed class EmptySpecification<T> : Specification<T> { }
