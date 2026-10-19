using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMilkSubscriptionStartDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "StartDate",
                table: "MilkSubscriptions",
                type: "date",
                nullable: false,
                // DateOnly.MinValue for existing subscriptions — the start-date cutoff only ever
                // clamps to the first day of whatever month is being viewed, so this preserves
                // today's behavior (full month counted) for households already using the app.
                defaultValue: DateOnly.MinValue);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "MilkSubscriptions");
        }
    }
}
