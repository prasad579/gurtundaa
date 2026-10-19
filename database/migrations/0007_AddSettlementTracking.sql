BEGIN TRANSACTION;
ALTER TABLE [LaundryBatches] ADD [IsPaid] bit NOT NULL DEFAULT CAST(0 AS bit);

ALTER TABLE [LaundryBatches] ADD [PaidAt] datetimeoffset NULL;

CREATE TABLE [MilkSettlements] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [Year] int NOT NULL,
    [Month] int NOT NULL,
    [IsPaid] bit NOT NULL,
    [PaidAt] datetimeoffset NULL,
    CONSTRAINT [PK_MilkSettlements] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_MilkSettlements_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);

CREATE UNIQUE INDEX [IX_MilkSettlements_UserId_Year_Month] ON [MilkSettlements] ([UserId], [Year], [Month]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261018155732_AddSettlementTracking', N'10.0.13');

COMMIT;
GO

