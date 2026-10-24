using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMedicinePurposeAndNextVisit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "NextVisitDate",
                table: "Medicines",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Purpose",
                table: "Medicines",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NextVisitDate",
                table: "Medicines");

            migrationBuilder.DropColumn(
                name: "Purpose",
                table: "Medicines");
        }
    }
}
