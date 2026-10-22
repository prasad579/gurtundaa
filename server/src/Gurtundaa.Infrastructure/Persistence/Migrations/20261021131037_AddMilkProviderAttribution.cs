using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMilkProviderAttribution : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AddedByProviderId",
                table: "MilkExtraRequests",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "SeenByHouseholdAt",
                table: "MilkExtraRequests",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AddedByProviderId",
                table: "MilkDeliveryOverrides",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "SeenByHouseholdAt",
                table: "MilkDeliveryOverrides",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MilkExtraRequests_AddedByProviderId",
                table: "MilkExtraRequests",
                column: "AddedByProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_MilkDeliveryOverrides_AddedByProviderId",
                table: "MilkDeliveryOverrides",
                column: "AddedByProviderId");

            migrationBuilder.AddForeignKey(
                name: "FK_MilkDeliveryOverrides_AspNetUsers_AddedByProviderId",
                table: "MilkDeliveryOverrides",
                column: "AddedByProviderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MilkExtraRequests_AspNetUsers_AddedByProviderId",
                table: "MilkExtraRequests",
                column: "AddedByProviderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MilkDeliveryOverrides_AspNetUsers_AddedByProviderId",
                table: "MilkDeliveryOverrides");

            migrationBuilder.DropForeignKey(
                name: "FK_MilkExtraRequests_AspNetUsers_AddedByProviderId",
                table: "MilkExtraRequests");

            migrationBuilder.DropIndex(
                name: "IX_MilkExtraRequests_AddedByProviderId",
                table: "MilkExtraRequests");

            migrationBuilder.DropIndex(
                name: "IX_MilkDeliveryOverrides_AddedByProviderId",
                table: "MilkDeliveryOverrides");

            migrationBuilder.DropColumn(
                name: "AddedByProviderId",
                table: "MilkExtraRequests");

            migrationBuilder.DropColumn(
                name: "SeenByHouseholdAt",
                table: "MilkExtraRequests");

            migrationBuilder.DropColumn(
                name: "AddedByProviderId",
                table: "MilkDeliveryOverrides");

            migrationBuilder.DropColumn(
                name: "SeenByHouseholdAt",
                table: "MilkDeliveryOverrides");
        }
    }
}
