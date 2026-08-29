using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Samsary.Application.Common.Interfaces;
using Samsary.Domain.Enums;
using Samsary.Infrastructure.Configuration;

namespace Samsary.Infrastructure.Services;

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;
    private readonly CloudinarySettings _settings;
    private readonly ILogger<CloudinaryService> _logger;

    public CloudinaryService(IOptions<CloudinarySettings> options, ILogger<CloudinaryService> logger)
    {
        _settings = options.Value;
        _logger = logger;
        var account = new Account(_settings.CloudName, _settings.ApiKey, _settings.ApiSecret);
        _cloudinary = new Cloudinary(account) { Api = { Secure = true } };
    }

    public async Task<UploadedMedia> UploadImageAsync(IUploadedFile file, CancellationToken ct = default)
    {
        if (file.Length == 0) throw new InvalidOperationException("Empty file");
        await using var stream = file.OpenReadStream();
        var p = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "samsary/images",
            UseFilename = false,
            UniqueFilename = true,
            Overwrite = false
        };
        var r = await _cloudinary.UploadAsync(p, ct);
        if (r.Error is not null) throw new InvalidOperationException(r.Error.Message);
        return new UploadedMedia(r.SecureUrl.AbsoluteUri, r.PublicId, MediaType.Image, null, null);
    }

    public async Task<UploadedMedia> UploadVideoAsync(IUploadedFile file, CancellationToken ct = default)
    {
        if (file.Length == 0) throw new InvalidOperationException("Empty file");
        await using var stream = file.OpenReadStream();
        var p = new VideoUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "samsary/videos",
            UseFilename = false,
            UniqueFilename = true,
            Overwrite = false,
            // Auto quality + codec optimization for smoother streaming
            EagerAsync = true,
            EagerTransforms = [new Transformation().Quality("auto:eco").VideoCodec("auto")]
        };
        var r = await _cloudinary.UploadLargeAsync(p, 20 * 1024 * 1024);
        if (r.Error is not null) throw new InvalidOperationException(r.Error.Message);

        if (r.Duration > _settings.MaxVideoDurationSeconds)
        {
            // Roll back upload that violates the 5-minute rule.
            try { await DeleteAsync(r.PublicId, MediaType.Video, ct); }
            catch (Exception ex) { _logger.LogWarning(ex, "Failed to delete over-length video {Id}", r.PublicId); }
            throw new InvalidOperationException(
                $"Video exceeds maximum allowed duration of {_settings.MaxVideoDurationSeconds} seconds.");
        }

        var thumb = _cloudinary.Api.UrlVideoUp
            .Transform(new Transformation().Width(640).Crop("scale"))
            .Format("jpg").BuildUrl(r.PublicId);

        return new UploadedMedia(r.SecureUrl.AbsoluteUri, r.PublicId, MediaType.Video, r.Duration, thumb);
    }

    public async Task DeleteAsync(string publicId, MediaType type, CancellationToken ct = default)
    {
        var p = new DeletionParams(publicId)
        {
            ResourceType = type == MediaType.Video ? ResourceType.Video : ResourceType.Image
        };
        await _cloudinary.DestroyAsync(p);
    }
}
