using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddManualCustomersAndPickupRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LaundryPickupRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HouseholdUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProviderUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestedDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    HandledAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LaundryPickupRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LaundryPickupRequests_AspNetUsers_HouseholdUserId",
                        column: x => x.HouseholdUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LaundryPickupRequests_AspNetUsers_ProviderUserId",
                        column: x => x.ProviderUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ProviderCustomers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProviderUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Category = table.Column<byte>(type: "tinyint", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    LinkCode = table.Column<string>(type: "nvarchar(12)", maxLength: 12, nullable: true),
                    ClaimedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ArchivedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProviderCustomers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProviderCustomers_AspNetUsers_ClaimedByUserId",
                        column: x => x.ClaimedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProviderCustomers_AspNetUsers_ProviderUserId",
                        column: x => x.ProviderUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ManualLaundryBatches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProviderCustomerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ServiceType = table.Column<byte>(type: "tinyint", nullable: false),
                    GivenOn = table.Column<DateOnly>(type: "date", nullable: false),
                    ExpectedReturn = table.Column<DateOnly>(type: "date", nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    PickedUpOn = table.Column<DateOnly>(type: "date", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    IsPaid = table.Column<bool>(type: "bit", nullable: false),
                    PaidAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ItemsJson = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ManualLaundryBatches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ManualLaundryBatches_ProviderCustomers_ProviderCustomerId",
                        column: x => x.ProviderCustomerId,
                        principalTable: "ProviderCustomers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ManualMilkEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProviderCustomerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    QuantityLtr = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    RatePerLtr = table.Column<decimal>(type: "decimal(8,2)", nullable: false),
                    IsExtra = table.Column<bool>(type: "bit", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IsPaid = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ManualMilkEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ManualMilkEntries_ProviderCustomers_ProviderCustomerId",
                        column: x => x.ProviderCustomerId,
                        principalTable: "ProviderCustomers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LaundryPickupRequests_HouseholdUserId",
                table: "LaundryPickupRequests",
                column: "HouseholdUserId");

            migrationBuilder.CreateIndex(
                name: "IX_LaundryPickupRequests_ProviderUserId_HandledAt",
                table: "LaundryPickupRequests",
                columns: new[] { "ProviderUserId", "HandledAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ManualLaundryBatches_ProviderCustomerId_Status",
                table: "ManualLaundryBatches",
                columns: new[] { "ProviderCustomerId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ManualMilkEntries_ProviderCustomerId_Date_IsExtra",
                table: "ManualMilkEntries",
                columns: new[] { "ProviderCustomerId", "Date", "IsExtra" });

            migrationBuilder.CreateIndex(
                name: "IX_ProviderCustomers_ClaimedByUserId",
                table: "ProviderCustomers",
                column: "ClaimedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProviderCustomers_LinkCode",
                table: "ProviderCustomers",
                column: "LinkCode",
                unique: true,
                filter: "[LinkCode] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ProviderCustomers_ProviderUserId_ArchivedAt",
                table: "ProviderCustomers",
                columns: new[] { "ProviderUserId", "ArchivedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LaundryPickupRequests");

            migrationBuilder.DropTable(
                name: "ManualLaundryBatches");

            migrationBuilder.DropTable(
                name: "ManualMilkEntries");

            migrationBuilder.DropTable(
                name: "ProviderCustomers");
        }
    }
}
