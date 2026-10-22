using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddManualMilkVarietyAndReturns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ManualMilkEntries_ProviderCustomerId_Date_Slot_IsExtra",
                table: "ManualMilkEntries");

            migrationBuilder.DropColumn(
                name: "IsExtra",
                table: "ManualMilkEntries");

            migrationBuilder.AddColumn<string>(
                name: "DefaultVariety",
                table: "ProviderCustomers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "Kind",
                table: "ManualMilkEntries",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<string>(
                name: "Variety",
                table: "ManualMilkEntries",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ManualMilkEntries_ProviderCustomerId_Date_Slot_Variety_Kind",
                table: "ManualMilkEntries",
                columns: new[] { "ProviderCustomerId", "Date", "Slot", "Variety", "Kind" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ManualMilkEntries_ProviderCustomerId_Date_Slot_Variety_Kind",
                table: "ManualMilkEntries");

            migrationBuilder.DropColumn(
                name: "DefaultVariety",
                table: "ProviderCustomers");

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "ManualMilkEntries");

            migrationBuilder.DropColumn(
                name: "Variety",
                table: "ManualMilkEntries");

            migrationBuilder.AddColumn<bool>(
                name: "IsExtra",
                table: "ManualMilkEntries",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_ManualMilkEntries_ProviderCustomerId_Date_Slot_IsExtra",
                table: "ManualMilkEntries",
                columns: new[] { "ProviderCustomerId", "Date", "Slot", "IsExtra" });
        }
    }
}
