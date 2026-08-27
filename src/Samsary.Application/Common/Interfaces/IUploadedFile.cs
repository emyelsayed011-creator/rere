namespace Samsary.Application.Common.Interfaces;

/// <summary>
/// Transport-agnostic abstraction over an uploaded file so the Application layer
/// does not depend on ASP.NET Core's IFormFile.
/// </summary>
public interface IUploadedFile
{
    string FileName { get; }
    long Length { get; }
    Stream OpenReadStream();
}
