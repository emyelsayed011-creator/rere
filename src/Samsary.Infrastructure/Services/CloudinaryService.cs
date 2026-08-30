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

    // Recommended safe chunk size for UploadLargeAsync — large chunks (e.g. 20MB)
    // increase the chance of timeouts/failures on slower connections.
    private const int ChunkSizeBytes = 6 * 1024 * 1024; // 6MB

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

            // Note: older code requested eager transforms (HLS manifest) which
            // some Cloudinary client versions expose differently. To remain
            // compatible with the installed CloudinaryDotNet package, we
            // perform a standard large upload and prefer the returned secure
            // URL as the streaming source. If your Cloudinary account is set
            // to auto-generate HLS manifests server-side, `r.SecureUrl` will
            // point to a playable resource; otherwise adapt this section to
            // request eager transforms according to your client version.
        };

        VideoUploadResult r;
        try
        {
            r = await _cloudinary.UploadLargeAsync(p, ChunkSizeBytes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cloudinary video upload failed for file {FileName}", file.FileName);
            throw new InvalidOperationException("Video upload failed. Please try again.", ex);
        }

        if (r.Error is not null)
        {
            _logger.LogError("Cloudinary returned an error for {FileName}: {Error}", file.FileName, r.Error.Message);
            throw new InvalidOperationException(r.Error.Message);
        }

        if (r.Duration > _settings.MaxVideoDurationSeconds)
        {
            // Roll back upload that violates the max-duration rule.
            try { await DeleteAsync(r.PublicId, MediaType.Video, ct); }
            catch (Exception ex) { _logger.LogWarning(ex, "Failed to delete over-length video {Id}", r.PublicId); }
            throw new InvalidOperationException(
                $"Video exceeds maximum allowed duration of {_settings.MaxVideoDurationSeconds} seconds.");
        }

        var thumb = _cloudinary.Api.UrlVideoUp
            .Transform(new Transformation().Width(640).Crop("scale"))
            .BuildUrl(r.PublicId);

        // Prefer the secure URL returned by the upload result. If your
        // account has eager HLS generation enabled and your client returns
        // eager transforms, adapt this code to prefer them instead.
        var streamingUrl = r.SecureUrl?.AbsoluteUri ?? string.Empty;

        return new UploadedMedia(streamingUrl, r.PublicId, MediaType.Video, r.Duration, thumb);
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