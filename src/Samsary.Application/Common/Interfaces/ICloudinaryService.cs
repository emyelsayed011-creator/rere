using Samsary.Domain.Enums;

namespace Samsary.Application.Common.Interfaces;

public record UploadedMedia(string Url, string PublicId, MediaType MediaType, double? DurationSeconds, string? ThumbnailUrl);

public interface ICloudinaryService
{
    Task<UploadedMedia> UploadImageAsync(IUploadedFile file, CancellationToken ct = default);
    Task<UploadedMedia> UploadVideoAsync(IUploadedFile file, CancellationToken ct = default);
    Task DeleteAsync(string publicId, MediaType type, CancellationToken ct = default);
}
