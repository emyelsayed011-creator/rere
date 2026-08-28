using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Samsary.Application.DTOs;
using Samsary.Application.Features.Categories.Commands;
using Samsary.Application.Features.Categories.Queries;
using Samsary.Infrastructure.Persistence;

namespace Samsary.Api.Controllers;

[Route("api/categories")]
public class CategoriesController : ApiControllerBase
{
    private readonly ISender _sender;

    public CategoriesController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
        => HandleResult(await _sender.Send(new GetCategoriesQuery(), ct));

    [Authorize(Roles = SeedData.AdminRole)]
    [HttpPost]
    public async Task<IActionResult> Create(CreateCategoryDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(new CreateCategoryCommand(dto.Name, dto.NameAr, dto.Slug, dto.IconClass), ct));

    [Authorize(Roles = SeedData.AdminRole)]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateCategoryDto dto, CancellationToken ct)
        => HandleResult(await _sender.Send(new UpdateCategoryCommand(id, dto.Name, dto.NameAr, dto.Slug, dto.IconClass), ct));

    [Authorize(Roles = SeedData.AdminRole)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => HandleResult(await _sender.Send(new DeleteCategoryCommand(id), ct));
}
