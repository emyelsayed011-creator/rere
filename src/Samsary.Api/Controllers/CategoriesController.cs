using Microsoft.AspNetCore.Mvc;
using Samsary.Application.DTOs;
using Samsary.Application.Services.Categories;

namespace Samsary.Api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categories;

    public CategoriesController(ICategoryService categories) => _categories = categories;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> Get(CancellationToken ct)
        => Ok(await _categories.GetAllAsync(ct));
}
