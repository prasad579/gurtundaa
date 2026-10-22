using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddShopProfileDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<TimeOnly>(
                name: "ClosesAt",
                table: "ShopProfiles",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPhonesJson",
                table: "ShopProfiles",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "ShopProfiles",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Latitude",
                table: "ShopProfiles",
                type: "decimal(9,6)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitude",
                table: "ShopProfiles",
                type: "decimal(9,6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OpenDaysJson",
                table: "ShopProfiles",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<TimeOnly>(
                name: "OpensAt",
                table: "ShopProfiles",
                type: "time",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClosesAt",
                table: "ShopProfiles");

            migrationBuilder.DropColumn(
                name: "ContactPhonesJson",
                table: "ShopProfiles");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "ShopProfiles");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "ShopProfiles");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "ShopProfiles");

            migrationBuilder.DropColumn(
                name: "OpenDaysJson",
                table: "ShopProfiles");

            migrationBuilder.DropColumn(
                name: "OpensAt",
                table: "ShopProfiles");
        }
    }
}
