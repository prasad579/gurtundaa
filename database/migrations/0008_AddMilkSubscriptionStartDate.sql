BEGIN TRANSACTION;
ALTER TABLE [MilkSubscriptions] ADD [StartDate] date NOT NULL DEFAULT '0001-01-01';

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261019070008_AddMilkSubscriptionStartDate', N'10.0.13');

COMMIT;
GO

