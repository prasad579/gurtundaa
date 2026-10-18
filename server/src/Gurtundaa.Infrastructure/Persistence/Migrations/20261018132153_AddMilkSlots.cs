using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMilkSlots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MilkDeliveryOverrides_UserId_Date",
                table: "MilkDeliveryOverrides");

            migrationBuilder.RenameColumn(
                name: "DeliveryWindowStart",
                table: "MilkSubscriptions",
                newName: "MorningWindowStart");

            migrationBuilder.RenameColumn(
                name: "DeliveryWindowEnd",
                table: "MilkSubscriptions",
                newName: "MorningWindowEnd");

            migrationBuilder.RenameColumn(
                name: "DailyQuantityLtr",
                table: "MilkSubscriptions",
                newName: "MorningQuantityLtr");

            migrationBuilder.RenameColumn(
                name: "QuantityLtr",
                table: "MilkQuantityChanges",
                newName: "MorningQuantityLtr");

            migrationBuilder.AddColumn<bool>(
                name: "EveningEnabled",
                table: "MilkSubscriptions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "EveningQuantityLtr",
                table: "MilkSubscriptions",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "EveningWindowEnd",
                table: "MilkSubscriptions",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "EveningWindowStart",
                table: "MilkSubscriptions",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "MorningEnabled",
                table: "MilkSubscriptions",
                type: "bit",
                nullable: false,
                // Existing subscriptions already deliver once a day (what's now "Morning") —
                // default them to enabled so this migration doesn't silently turn off delivery.
                defaultValue: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EveningQuantityLtr",
                table: "MilkQuantityChanges",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<byte>(
                name: "Slot",
                table: "MilkExtraRequests",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<byte>(
                name: "Slot",
                table: "MilkDeliveryOverrides",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.CreateIndex(
                name: "IX_MilkDeliveryOverrides_UserId_Date_Slot",
                table: "MilkDeliveryOverrides",
                columns: new[] { "UserId", "Date", "Slot" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MilkDeliveryOverrides_UserId_Date_Slot",
                table: "MilkDeliveryOverrides");

            migrationBuilder.DropColumn(
                name: "EveningEnabled",
                table: "MilkSubscriptions");

            migrationBuilder.DropColumn(
                name: "EveningQuantityLtr",
                table: "MilkSubscriptions");

            migrationBuilder.DropColumn(
                name: "EveningWindowEnd",
                table: "MilkSubscriptions");

            migrationBuilder.DropColumn(
                name: "EveningWindowStart",
                table: "MilkSubscriptions");

            migrationBuilder.DropColumn(
                name: "MorningEnabled",
                table: "MilkSubscriptions");

            migrationBuilder.DropColumn(
                name: "EveningQuantityLtr",
                table: "MilkQuantityChanges");

            migrationBuilder.DropColumn(
                name: "Slot",
                table: "MilkExtraRequests");

            migrationBuilder.DropColumn(
                name: "Slot",
                table: "MilkDeliveryOverrides");

            migrationBuilder.RenameColumn(
                name: "MorningWindowStart",
                table: "MilkSubscriptions",
                newName: "DeliveryWindowStart");

            migrationBuilder.RenameColumn(
                name: "MorningWindowEnd",
                table: "MilkSubscriptions",
                newName: "DeliveryWindowEnd");

            migrationBuilder.RenameColumn(
                name: "MorningQuantityLtr",
                table: "MilkSubscriptions",
                newName: "DailyQuantityLtr");

            migrationBuilder.RenameColumn(
                name: "MorningQuantityLtr",
                table: "MilkQuantityChanges",
                newName: "QuantityLtr");

            migrationBuilder.CreateIndex(
                name: "IX_MilkDeliveryOverrides_UserId_Date",
                table: "MilkDeliveryOverrides",
                columns: new[] { "UserId", "Date" },
                unique: true);
        }
    }
}
