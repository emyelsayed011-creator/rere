using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Samsary.Api.Data;
using Samsary.Api.DTOs;

namespace Samsary.Api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public CategoriesController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IEnumerable<CategoryDto>> Get() =>
        await _db.Categories.OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Slug, c.IconClass)).ToListAsync();
}
