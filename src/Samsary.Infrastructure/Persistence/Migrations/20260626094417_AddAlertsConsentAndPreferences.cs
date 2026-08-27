using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Samsary.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAlertsConsentAndPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ListingAlerts",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: true),
                    Location = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DailyTriggerCount = table.Column<int>(type: "integer", nullable: false),
                    LastCountResetAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastTriggeredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ListingAlerts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ListingAlerts_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ListingAlerts_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "NotificationPreferences",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    EmailEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    SmsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    WebPushEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyOnNewMessage = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyOnListingAlert = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyOnListingStatus = table.Column<bool>(type: "boolean", nullable: false),
                    MessageEmailDelayMinutes = table.Column<int>(type: "integer", nullable: false),
                    ListingAlertDigest = table.Column<bool>(type: "boolean", nullable: false),
                    MaxListingAlertsPerDay = table.Column<int>(type: "integer", nullable: false),
                    QuietHoursEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    QuietHoursStartUtc = table.Column<int>(type: "integer", nullable: false),
                    QuietHoursEndUtc = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationPreferences", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_NotificationPreferences_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserConsents",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    SessionId = table.Column<string>(type: "text", nullable: false),
                    NecessaryConsent = table.Column<bool>(type: "boolean", nullable: false),
                    AnalyticsConsent = table.Column<bool>(type: "boolean", nullable: false),
                    MarketingConsent = table.Column<bool>(type: "boolean", nullable: false),
                    TermsAccepted = table.Column<bool>(type: "boolean", nullable: false),
                    TermsVersion = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PrivacyPolicyAccepted = table.Column<bool>(type: "boolean", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserConsents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserConsents_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ListingAlerts_CategoryId",
                table: "ListingAlerts",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ListingAlerts_UserId_IsActive",
                table: "ListingAlerts",
                columns: new[] { "UserId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_UserConsents_SessionId",
                table: "UserConsents",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_UserConsents_UserId",
                table: "UserConsents",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ListingAlerts");

            migrationBuilder.DropTable(
                name: "NotificationPreferences");

            migrationBuilder.DropTable(
                name: "UserConsents");
        }
    }
}
