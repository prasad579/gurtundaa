using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQuoteFulfillment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte>(
                name: "FulfillmentStatus",
                table: "Quotes",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<string>(
                name: "PackedItemKeysJson",
                table: "Quotes",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FulfillmentStatus",
                table: "Quotes");

            migrationBuilder.DropColumn(
                name: "PackedItemKeysJson",
                table: "Quotes");
        }
    }
}
