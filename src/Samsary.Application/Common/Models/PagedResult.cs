namespace Samsary.Application.Common.Models;

public record PagedResult<T>(int Total, int Page, int PageSize, IReadOnlyList<T> Items, int? NextCursor = null);
