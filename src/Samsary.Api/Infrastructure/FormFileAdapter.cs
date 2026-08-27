using Microsoft.AspNetCore.Http;
using Samsary.Application.Common.Interfaces;

namespace Samsary.Api.Infrastructure;

/// <summary>Adapts ASP.NET Core's <see cref="IFormFile"/> to the Application's <see cref="IUploadedFile"/>.</summary>
public sealed class FormFileAdapter : IUploadedFile
{
    private readonly IFormFile _file;

    public FormFileAdapter(IFormFile file) => _file = file;

    public string FileName => _file.FileName;
    public long Length => _file.Length;
    public Stream OpenReadStream() => _file.OpenReadStream();
}
