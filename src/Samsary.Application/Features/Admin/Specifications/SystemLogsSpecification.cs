using Samsary.Domain.Entities;
using Samsary.Domain.Specifications;

namespace Samsary.Application.Features.Admin.Specifications;

/// <summary>
/// Returns a paged slice of system logs, optionally filtered by severity level.
/// When <paramref name="forCounting"/> is <c>true</c> skips ordering and paging so the same
/// parameters can drive both the data query and the total-count query.
/// </summary>
public sealed class SystemLogsSpecification : Specification<SystemLog>
{
    public SystemLogsSpecification(int page, int pageSize, string? level, bool forCounting = false)
    {
        if (!string.IsNullOrWhiteSpace(level)) Where(l => l.Level == level);

        if (!forCounting)
        {
            ApplyOrderByDescending(l => l.CreatedAt);
            ApplyPaging((page - 1) * pageSize, pageSize);
        }
    }
}
