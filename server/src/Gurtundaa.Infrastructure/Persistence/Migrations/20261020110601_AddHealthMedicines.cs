using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddHealthMedicines : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HouseholdMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Relation = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    AvatarEmoji = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HouseholdMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HouseholdMembers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Medicines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MemberId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PrescriptionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Mode = table.Column<byte>(type: "tinyint", nullable: false),
                    CourseDays = table.Column<int>(type: "int", nullable: true),
                    MorningQty = table.Column<int>(type: "int", nullable: false),
                    AfternoonQty = table.Column<int>(type: "int", nullable: false),
                    EveningQty = table.Column<int>(type: "int", nullable: false),
                    NightQty = table.Column<int>(type: "int", nullable: false),
                    FoodTiming = table.Column<byte>(type: "tinyint", nullable: false),
                    StockCount = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Medicines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Medicines_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Medicines_HouseholdMembers_MemberId",
                        column: x => x.MemberId,
                        principalTable: "HouseholdMembers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DoseLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MedicineId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Slot = table.Column<byte>(type: "tinyint", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    TakenAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoseLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoseLogs_Medicines_MedicineId",
                        column: x => x.MedicineId,
                        principalTable: "Medicines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DoseLogs_MedicineId_Date_Slot",
                table: "DoseLogs",
                columns: new[] { "MedicineId", "Date", "Slot" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HouseholdMembers_UserId",
                table: "HouseholdMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Medicines_MemberId",
                table: "Medicines",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_Medicines_UserId_MemberId",
                table: "Medicines",
                columns: new[] { "UserId", "MemberId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DoseLogs");

            migrationBuilder.DropTable(
                name: "Medicines");

            migrationBuilder.DropTable(
                name: "HouseholdMembers");
        }
    }
}
