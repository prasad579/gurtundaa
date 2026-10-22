using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProviderLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProviderLinks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HouseholdUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ServiceContactId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Category = table.Column<byte>(type: "tinyint", nullable: false),
                    InviteCode = table.Column<string>(type: "nvarchar(12)", maxLength: 12, nullable: false),
                    ProviderUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ClaimedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RevokedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProviderLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProviderLinks_AspNetUsers_HouseholdUserId",
                        column: x => x.HouseholdUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProviderLinks_AspNetUsers_ProviderUserId",
                        column: x => x.ProviderUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProviderLinks_ServiceContacts_ServiceContactId",
                        column: x => x.ServiceContactId,
                        principalTable: "ServiceContacts",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProviderLinks_HouseholdUserId_ServiceContactId",
                table: "ProviderLinks",
                columns: new[] { "HouseholdUserId", "ServiceContactId" });

            migrationBuilder.CreateIndex(
                name: "IX_ProviderLinks_InviteCode",
                table: "ProviderLinks",
                column: "InviteCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProviderLinks_ProviderUserId_Category_RevokedAt",
                table: "ProviderLinks",
                columns: new[] { "ProviderUserId", "Category", "RevokedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ProviderLinks_ServiceContactId",
                table: "ProviderLinks",
                column: "ServiceContactId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProviderLinks");
        }
    }
}
