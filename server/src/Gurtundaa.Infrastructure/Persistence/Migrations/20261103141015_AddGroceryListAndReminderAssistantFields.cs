using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGroceryListAndReminderAssistantFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "MemberId",
                table: "Reminders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "Recurrence",
                table: "Reminders",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<byte>(
                name: "RecurrenceDayOfWeek",
                table: "Reminders",
                type: "tinyint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GroceryItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsChecked = table.Column<bool>(type: "bit", nullable: false),
                    RecurringWeekday = table.Column<byte>(type: "tinyint", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroceryItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroceryItems_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reminders_MemberId",
                table: "Reminders",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_GroceryItems_UserId_IsChecked",
                table: "GroceryItems",
                columns: new[] { "UserId", "IsChecked" });

            migrationBuilder.AddForeignKey(
                name: "FK_Reminders_HouseholdMembers_MemberId",
                table: "Reminders",
                column: "MemberId",
                principalTable: "HouseholdMembers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reminders_HouseholdMembers_MemberId",
                table: "Reminders");

            migrationBuilder.DropTable(
                name: "GroceryItems");

            migrationBuilder.DropIndex(
                name: "IX_Reminders_MemberId",
                table: "Reminders");

            migrationBuilder.DropColumn(
                name: "MemberId",
                table: "Reminders");

            migrationBuilder.DropColumn(
                name: "Recurrence",
                table: "Reminders");

            migrationBuilder.DropColumn(
                name: "RecurrenceDayOfWeek",
                table: "Reminders");
        }
    }
}
