BEGIN TRANSACTION;
CREATE TABLE [Bills] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [Category] tinyint NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Amount] decimal(10,2) NOT NULL,
    [DueDate] date NOT NULL,
    [Recurrence] tinyint NOT NULL,
    [ReminderLeadDays] int NOT NULL,
    [IsPaid] bit NOT NULL,
    [PaidAt] datetimeoffset NULL,
    [Notes] nvarchar(200) NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [UpdatedAt] datetimeoffset NOT NULL,
    CONSTRAINT [PK_Bills] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Bills_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_Bills_UserId_DueDate] ON [Bills] ([UserId], [DueDate]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261019110854_AddBills', N'10.0.13');

COMMIT;
GO

