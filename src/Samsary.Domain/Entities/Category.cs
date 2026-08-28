namespace Samsary.Domain.Entities;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameAr { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string? IconClass { get; set; }

    public ICollection<Listing> Listings { get; set; } = new List<Listing>();
}
