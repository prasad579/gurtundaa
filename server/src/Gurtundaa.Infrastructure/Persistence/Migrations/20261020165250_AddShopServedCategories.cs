using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddShopServedCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ServedCategoryKeysJson",
                table: "ShopProfiles",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ServedCategoryKeysJson",
                table: "ShopProfiles");
        }
    }
}
