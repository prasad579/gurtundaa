using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gurtundaa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMarketplaceQuotations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "QuotationRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CustomerUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    ItemsJson = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    AcceptedQuoteId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuotationRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuotationRequests_AspNetUsers_CustomerUserId",
                        column: x => x.CustomerUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuotationRequestShopTargets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuotationRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShopUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuotationRequestShopTargets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuotationRequestShopTargets_AspNetUsers_ShopUserId",
                        column: x => x.ShopUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_QuotationRequestShopTargets_QuotationRequests_QuotationRequestId",
                        column: x => x.QuotationRequestId,
                        principalTable: "QuotationRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Quotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuotationRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShopUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    ItemsJson = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Quotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Quotes_AspNetUsers_ShopUserId",
                        column: x => x.ShopUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Quotes_QuotationRequests_QuotationRequestId",
                        column: x => x.QuotationRequestId,
                        principalTable: "QuotationRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuotationRequests_AcceptedQuoteId",
                table: "QuotationRequests",
                column: "AcceptedQuoteId");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationRequests_CustomerUserId_CreatedAt",
                table: "QuotationRequests",
                columns: new[] { "CustomerUserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_QuotationRequestShopTargets_QuotationRequestId",
                table: "QuotationRequestShopTargets",
                column: "QuotationRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationRequestShopTargets_ShopUserId_QuotationRequestId",
                table: "QuotationRequestShopTargets",
                columns: new[] { "ShopUserId", "QuotationRequestId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Quotes_QuotationRequestId_ShopUserId",
                table: "Quotes",
                columns: new[] { "QuotationRequestId", "ShopUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Quotes_ShopUserId",
                table: "Quotes",
                column: "ShopUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_QuotationRequests_Quotes_AcceptedQuoteId",
                table: "QuotationRequests",
                column: "AcceptedQuoteId",
                principalTable: "Quotes",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QuotationRequests_Quotes_AcceptedQuoteId",
                table: "QuotationRequests");

            migrationBuilder.DropTable(
                name: "QuotationRequestShopTargets");

            migrationBuilder.DropTable(
                name: "Quotes");

            migrationBuilder.DropTable(
                name: "QuotationRequests");
        }
    }
}
