using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Samsary.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddListingAdsAndTargeting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "AspNetUsers",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "AspNetUsers",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ListingId",
                table: "Advertisements",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetAudience",
                table: "Advertisements",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "all");

            migrationBuilder.AddColumn<string>(
                name: "TargetCountries",
                table: "Advertisements",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetGenders",
                table: "Advertisements",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetLocations",
                table: "Advertisements",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TargetMaxAge",
                table: "Advertisements",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TargetMinAge",
                table: "Advertisements",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Advertisements_ListingId",
                table: "Advertisements",
                column: "ListingId");

            migrationBuilder.AddForeignKey(
                name: "FK_Advertisements_Listings_ListingId",
                table: "Advertisements",
                column: "ListingId",
                principalTable: "Listings",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Advertisements_Listings_ListingId",
                table: "Advertisements");

            migrationBuilder.DropIndex(
                name: "IX_Advertisements_ListingId",
                table: "Advertisements");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ListingId",
                table: "Advertisements");

            migrationBuilder.DropColumn(
                name: "TargetAudience",
                table: "Advertisements");

            migrationBuilder.DropColumn(
                name: "TargetCountries",
                table: "Advertisements");

            migrationBuilder.DropColumn(
                name: "TargetGenders",
                table: "Advertisements");

            migrationBuilder.DropColumn(
                name: "TargetLocations",
                table: "Advertisements");

            migrationBuilder.DropColumn(
                name: "TargetMaxAge",
                table: "Advertisements");

            migrationBuilder.DropColumn(
                name: "TargetMinAge",
                table: "Advertisements");
        }
    }
}
