using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddManualMilkEntrySlot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ManualMilkEntries_ProviderCustomerId_Date_IsExtra",
                table: "ManualMilkEntries");

            migrationBuilder.AddColumn<byte>(
                name: "Slot",
                table: "ManualMilkEntries",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.CreateIndex(
                name: "IX_ManualMilkEntries_ProviderCustomerId_Date_Slot_IsExtra",
                table: "ManualMilkEntries",
                columns: new[] { "ProviderCustomerId", "Date", "Slot", "IsExtra" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ManualMilkEntries_ProviderCustomerId_Date_Slot_IsExtra",
                table: "ManualMilkEntries");

            migrationBuilder.DropColumn(
                name: "Slot",
                table: "ManualMilkEntries");

            migrationBuilder.CreateIndex(
                name: "IX_ManualMilkEntries_ProviderCustomerId_Date_IsExtra",
                table: "ManualMilkEntries",
                columns: new[] { "ProviderCustomerId", "Date", "IsExtra" });
        }
    }
}
