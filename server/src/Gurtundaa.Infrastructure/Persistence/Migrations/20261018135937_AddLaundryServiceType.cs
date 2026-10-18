using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLaundryServiceType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte>(
                name: "ServiceType",
                table: "LaundryBatches",
                type: "tinyint",
                nullable: false,
                // Existing batches went through the quote-at-pickup flow, i.e. "Wash & Iron" (1),
                // not the flat-rate "Ironing" (0) — backfill them as such.
                defaultValue: (byte)1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ServiceType",
                table: "LaundryBatches");
        }
    }
}
