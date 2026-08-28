using Microsoft.EntityFrameworkCore.Migrations;
using NpgsqlTypes;

#nullable disable

namespace Samsary.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryNameArAndUserFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<NpgsqlTsVector>(
                name: "SearchVector",
                table: "Listings",
                type: "tsvector",
                nullable: true)
                .Annotation("Npgsql:TsVectorConfig", "english")
                .Annotation("Npgsql:TsVectorProperties", new[] { "Title", "Description" });

            migrationBuilder.AddColumn<string>(
                name: "NameAr",
                table: "Categories",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Listings_SearchVector",
                table: "Listings",
                column: "SearchVector")
                .Annotation("Npgsql:IndexMethod", "GIN");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Listings_SearchVector",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "SearchVector",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "NameAr",
                table: "Categories");
        }
    }
}
