using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddManualCustomerMilkDefaults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DefaultQuantityLtr",
                table: "ProviderCustomers",
                type: "decimal(5,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DefaultRatePerLtr",
                table: "ProviderCustomers",
                type: "decimal(8,2)",
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "DefaultSlot",
                table: "ProviderCustomers",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DefaultQuantityLtr",
                table: "ProviderCustomers");

            migrationBuilder.DropColumn(
                name: "DefaultRatePerLtr",
                table: "ProviderCustomers");

            migrationBuilder.DropColumn(
                name: "DefaultSlot",
                table: "ProviderCustomers");
        }
    }
}
