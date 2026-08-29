using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Samsary.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddIsNegotiableToListing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SiteNameAr",
                table: "ThemeSettings",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsNegotiable",
                table: "Listings",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SiteNameAr",
                table: "ThemeSettings");

            migrationBuilder.DropColumn(
                name: "IsNegotiable",
                table: "Listings");
        }
    }
}
