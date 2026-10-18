BEGIN TRANSACTION;
ALTER TABLE [LaundryBatches] ADD [ServiceType] tinyint NOT NULL DEFAULT CAST(1 AS tinyint);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261018135937_AddLaundryServiceType', N'10.0.13');

COMMIT;
GO

