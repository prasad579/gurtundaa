using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUpiPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ConfirmedAt",
                table: "MilkPayments",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "Method",
                table: "MilkPayments",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<byte>(
                name: "Status",
                table: "MilkPayments",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<string>(
                name: "UpiId",
                table: "AspNetUsers",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MilkPayments_Status",
                table: "MilkPayments",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MilkPayments_Status",
                table: "MilkPayments");

            migrationBuilder.DropColumn(
                name: "ConfirmedAt",
                table: "MilkPayments");

            migrationBuilder.DropColumn(
                name: "Method",
                table: "MilkPayments");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "MilkPayments");

            migrationBuilder.DropColumn(
                name: "UpiId",
                table: "AspNetUsers");
        }
    }
}
