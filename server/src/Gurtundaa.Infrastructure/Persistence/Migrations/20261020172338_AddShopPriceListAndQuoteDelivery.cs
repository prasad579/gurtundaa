using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddShopPriceListAndQuoteDelivery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "ServedCategoryKeysJson",
                table: "ShopProfiles",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "[]",
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000);

            migrationBuilder.AddColumn<string>(
                name: "PriceListJson",
                table: "ShopProfiles",
                type: "nvarchar(max)",
                maxLength: 8000,
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<decimal>(
                name: "DeliveryChargeAmount",
                table: "Quotes",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "EstimatedDeliveryMinutes",
                table: "Quotes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ValidUntil",
                table: "Quotes",
                type: "datetimeoffset",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PriceListJson",
                table: "ShopProfiles");

            migrationBuilder.DropColumn(
                name: "DeliveryChargeAmount",
                table: "Quotes");

            migrationBuilder.DropColumn(
                name: "EstimatedDeliveryMinutes",
                table: "Quotes");

            migrationBuilder.DropColumn(
                name: "ValidUntil",
                table: "Quotes");

            migrationBuilder.AlterColumn<string>(
                name: "ServedCategoryKeysJson",
                table: "ShopProfiles",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldDefaultValue: "[]");
        }
    }
}
