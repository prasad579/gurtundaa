IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetRoles] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(256) NULL,
        [NormalizedName] nvarchar(256) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetUsers] (
        [Id] uniqueidentifier NOT NULL,
        [DisplayName] nvarchar(100) NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UserName] nvarchar(256) NULL,
        [NormalizedUserName] nvarchar(256) NULL,
        [Email] nvarchar(256) NULL,
        [NormalizedEmail] nvarchar(256) NULL,
        [EmailConfirmed] bit NOT NULL,
        [PasswordHash] nvarchar(max) NULL,
        [SecurityStamp] nvarchar(max) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [PhoneNumberConfirmed] bit NOT NULL,
        [TwoFactorEnabled] bit NOT NULL,
        [LockoutEnd] datetimeoffset NULL,
        [LockoutEnabled] bit NOT NULL,
        [AccessFailedCount] int NOT NULL,
        CONSTRAINT [PK_AspNetUsers] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetRoleClaims] (
        [Id] int NOT NULL IDENTITY,
        [RoleId] uniqueidentifier NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoleClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetUserClaims] (
        [Id] int NOT NULL IDENTITY,
        [UserId] uniqueidentifier NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetUserLogins] (
        [LoginProvider] nvarchar(450) NOT NULL,
        [ProviderKey] nvarchar(450) NOT NULL,
        [ProviderDisplayName] nvarchar(max) NULL,
        [UserId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
        CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetUserRoles] (
        [UserId] uniqueidentifier NOT NULL,
        [RoleId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_AspNetUserRoles] PRIMARY KEY ([UserId], [RoleId]),
        CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetUserTokens] (
        [UserId] uniqueidentifier NOT NULL,
        [LoginProvider] nvarchar(450) NOT NULL,
        [Name] nvarchar(450) NOT NULL,
        [Value] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
        CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE TABLE [RefreshTokens] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [TokenHash] nvarchar(64) NOT NULL,
        [ExpiresAt] datetimeoffset NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [RevokedAt] datetimeoffset NULL,
        CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RefreshTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE TABLE [Reminders] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Title] nvarchar(200) NOT NULL,
        [Notes] nvarchar(2000) NULL,
        [DueAt] datetimeoffset NULL,
        [Priority] tinyint NOT NULL,
        [IsDone] bit NOT NULL,
        [CompletedAt] datetimeoffset NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_Reminders] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Reminders_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AspNetRoleClaims_RoleId] ON [AspNetRoleClaims] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [RoleNameIndex] ON [AspNetRoles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AspNetUserClaims_UserId] ON [AspNetUserClaims] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AspNetUserLogins_UserId] ON [AspNetUserLogins] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AspNetUserRoles_RoleId] ON [AspNetUserRoles] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE INDEX [EmailIndex] ON [AspNetUsers] ([NormalizedEmail]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UserNameIndex] ON [AspNetUsers] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_RefreshTokens_TokenHash] ON [RefreshTokens] ([TokenHash]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_UserId] ON [RefreshTokens] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Reminders_UserId_IsDone_DueAt] ON [Reminders] ([UserId], [IsDone], [DueAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015104428_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261015104428_InitialCreate', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015145350_AddPhoneOtpAndPhoneAuth'
)
BEGIN
    CREATE TABLE [PhoneOtps] (
        [Id] uniqueidentifier NOT NULL,
        [PhoneNumber] nvarchar(20) NOT NULL,
        [CodeHash] nvarchar(64) NOT NULL,
        [Attempts] int NOT NULL,
        [ExpiresAt] datetimeoffset NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [ConsumedAt] datetimeoffset NULL,
        CONSTRAINT [PK_PhoneOtps] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015145350_AddPhoneOtpAndPhoneAuth'
)
BEGIN
    CREATE INDEX [IX_PhoneOtps_PhoneNumber_ConsumedAt_ExpiresAt] ON [PhoneOtps] ([PhoneNumber], [ConsumedAt], [ExpiresAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015145350_AddPhoneOtpAndPhoneAuth'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261015145350_AddPhoneOtpAndPhoneAuth', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015161049_AddHouseholdProfile'
)
BEGIN
    CREATE TABLE [HouseholdProfiles] (
        [UserId] uniqueidentifier NOT NULL,
        [AccountType] nvarchar(30) NOT NULL,
        [Adults] int NOT NULL,
        [Children] int NOT NULL,
        [City] nvarchar(100) NULL,
        [EnabledFeatures] nvarchar(500) NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_HouseholdProfiles] PRIMARY KEY ([UserId]),
        CONSTRAINT [FK_HouseholdProfiles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015161049_AddHouseholdProfile'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261015161049_AddHouseholdProfile', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018092520_AddMilkManagement'
)
BEGIN
    CREATE TABLE [MilkDeliveryOverrides] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Date] date NOT NULL,
        [Status] tinyint NOT NULL,
        [QuantityLtr] decimal(5,2) NULL,
        [Note] nvarchar(200) NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_MilkDeliveryOverrides] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MilkDeliveryOverrides_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018092520_AddMilkManagement'
)
BEGIN
    CREATE TABLE [MilkExtraRequests] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Date] date NOT NULL,
        [QuantityLtr] decimal(5,2) NOT NULL,
        [Reason] nvarchar(200) NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_MilkExtraRequests] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MilkExtraRequests_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018092520_AddMilkManagement'
)
BEGIN
    CREATE TABLE [MilkPauses] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [StartDate] date NOT NULL,
        [EndDate] date NOT NULL,
        [Reason] nvarchar(200) NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_MilkPauses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MilkPauses_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018092520_AddMilkManagement'
)
BEGIN
    CREATE TABLE [ServiceContacts] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Category] tinyint NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [Phone] nvarchar(20) NOT NULL,
        [Address] nvarchar(200) NULL,
        [IsDefault] bit NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_ServiceContacts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ServiceContacts_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018092520_AddMilkManagement'
)
BEGIN
    CREATE TABLE [MilkSubscriptions] (
        [UserId] uniqueidentifier NOT NULL,
        [ContactId] uniqueidentifier NULL,
        [DailyQuantityLtr] decimal(5,2) NOT NULL,
        [RatePerLtr] decimal(8,2) NOT NULL,
        [DeliveryWindowStart] time NULL,
        [DeliveryWindowEnd] time NULL,
        [SettlementCycle] tinyint NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_MilkSubscriptions] PRIMARY KEY ([UserId]),
        CONSTRAINT [FK_MilkSubscriptions_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_MilkSubscriptions_ServiceContacts_ContactId] FOREIGN KEY ([ContactId]) REFERENCES [ServiceContacts] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018092520_AddMilkManagement'
)
BEGIN
    CREATE UNIQUE INDEX [IX_MilkDeliveryOverrides_UserId_Date] ON [MilkDeliveryOverrides] ([UserId], [Date]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018092520_AddMilkManagement'
)
BEGIN
    CREATE INDEX [IX_MilkExtraRequests_UserId_Date] ON [MilkExtraRequests] ([UserId], [Date]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018092520_AddMilkManagement'
)
BEGIN
    CREATE INDEX [IX_MilkPauses_UserId_StartDate_EndDate] ON [MilkPauses] ([UserId], [StartDate], [EndDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018092520_AddMilkManagement'
)
BEGIN
    CREATE INDEX [IX_MilkSubscriptions_ContactId] ON [MilkSubscriptions] ([ContactId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018092520_AddMilkManagement'
)
BEGIN
    CREATE INDEX [IX_ServiceContacts_UserId_Category] ON [ServiceContacts] ([UserId], [Category]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018092520_AddMilkManagement'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261018092520_AddMilkManagement', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018115839_AddLaundryManagement'
)
BEGIN
    CREATE TABLE [LaundryBatches] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [ContactId] uniqueidentifier NULL,
        [GivenOn] date NOT NULL,
        [ExpectedReturn] date NULL,
        [Status] tinyint NOT NULL,
        [PickedUpOn] date NULL,
        [Amount] decimal(8,2) NULL,
        [ItemsJson] nvarchar(2000) NOT NULL,
        [Notes] nvarchar(200) NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_LaundryBatches] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_LaundryBatches_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_LaundryBatches_ServiceContacts_ContactId] FOREIGN KEY ([ContactId]) REFERENCES [ServiceContacts] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018115839_AddLaundryManagement'
)
BEGIN
    CREATE INDEX [IX_LaundryBatches_ContactId] ON [LaundryBatches] ([ContactId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018115839_AddLaundryManagement'
)
BEGIN
    CREATE INDEX [IX_LaundryBatches_UserId_Status] ON [LaundryBatches] ([UserId], [Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018115839_AddLaundryManagement'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261018115839_AddLaundryManagement', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018130209_AddMilkQuantityChanges'
)
BEGIN
    CREATE TABLE [MilkQuantityChanges] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [StartDate] date NOT NULL,
        [EndDate] date NOT NULL,
        [QuantityLtr] decimal(5,2) NOT NULL,
        [Reason] nvarchar(200) NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_MilkQuantityChanges] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MilkQuantityChanges_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018130209_AddMilkQuantityChanges'
)
BEGIN
    CREATE INDEX [IX_MilkQuantityChanges_UserId_StartDate_EndDate] ON [MilkQuantityChanges] ([UserId], [StartDate], [EndDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018130209_AddMilkQuantityChanges'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261018130209_AddMilkQuantityChanges', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018132153_AddMilkSlots'
)
BEGIN
    DROP INDEX [IX_MilkDeliveryOverrides_UserId_Date] ON [MilkDeliveryOverrides];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018132153_AddMilkSlots'
)
BEGIN
    EXEC sp_rename N'[MilkSubscriptions].[DeliveryWindowStart]', N'MorningWindowStart', 'COLUMN';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018132153_AddMilkSlots'
)
BEGIN
    EXEC sp_rename N'[MilkSubscriptions].[DeliveryWindowEnd]', N'MorningWindowEnd', 'COLUMN';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018132153_AddMilkSlots'
)
BEGIN
    EXEC sp_rename N'[MilkSubscriptions].[DailyQuantityLtr]', N'MorningQuantityLtr', 'COLUMN';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018132153_AddMilkSlots'
)
BEGIN
    EXEC sp_rename N'[MilkQuantityChanges].[QuantityLtr]', N'MorningQuantityLtr', 'COLUMN';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018132153_AddMilkSlots'
)
BEGIN
    ALTER TABLE [MilkSubscriptions] ADD [EveningEnabled] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018132153_AddMilkSlots'
)
BEGIN
    ALTER TABLE [MilkSubscriptions] ADD [EveningQuantityLtr] decimal(5,2) NOT NULL DEFAULT 0.0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018132153_AddMilkSlots'
)
BEGIN
    ALTER TABLE [MilkSubscriptions] ADD [EveningWindowEnd] time NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018132153_AddMilkSlots'
)
BEGIN
    ALTER TABLE [MilkSubscriptions] ADD [EveningWindowStart] time NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018132153_AddMilkSlots'
)
BEGIN
    ALTER TABLE [MilkSubscriptions] ADD [MorningEnabled] bit NOT NULL DEFAULT CAST(1 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018132153_AddMilkSlots'
)
BEGIN
    ALTER TABLE [MilkQuantityChanges] ADD [EveningQuantityLtr] decimal(5,2) NOT NULL DEFAULT 0.0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018132153_AddMilkSlots'
)
BEGIN
    ALTER TABLE [MilkExtraRequests] ADD [Slot] tinyint NOT NULL DEFAULT CAST(0 AS tinyint);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018132153_AddMilkSlots'
)
BEGIN
    ALTER TABLE [MilkDeliveryOverrides] ADD [Slot] tinyint NOT NULL DEFAULT CAST(0 AS tinyint);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018132153_AddMilkSlots'
)
BEGIN
    CREATE UNIQUE INDEX [IX_MilkDeliveryOverrides_UserId_Date_Slot] ON [MilkDeliveryOverrides] ([UserId], [Date], [Slot]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018132153_AddMilkSlots'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261018132153_AddMilkSlots', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018135937_AddLaundryServiceType'
)
BEGIN
    ALTER TABLE [LaundryBatches] ADD [ServiceType] tinyint NOT NULL DEFAULT CAST(1 AS tinyint);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018135937_AddLaundryServiceType'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261018135937_AddLaundryServiceType', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018155732_AddSettlementTracking'
)
BEGIN
    ALTER TABLE [LaundryBatches] ADD [IsPaid] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018155732_AddSettlementTracking'
)
BEGIN
    ALTER TABLE [LaundryBatches] ADD [PaidAt] datetimeoffset NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018155732_AddSettlementTracking'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018155732_AddSettlementTracking'
)
BEGIN
    CREATE UNIQUE INDEX [IX_MilkSettlements_UserId_Year_Month] ON [MilkSettlements] ([UserId], [Year], [Month]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018155732_AddSettlementTracking'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261018155732_AddSettlementTracking', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019070008_AddMilkSubscriptionStartDate'
)
BEGIN
    ALTER TABLE [MilkSubscriptions] ADD [StartDate] date NOT NULL DEFAULT '0001-01-01';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019070008_AddMilkSubscriptionStartDate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261019070008_AddMilkSubscriptionStartDate', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019110854_AddBills'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019110854_AddBills'
)
BEGIN
    CREATE INDEX [IX_Bills_UserId_DueDate] ON [Bills] ([UserId], [DueDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019110854_AddBills'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261019110854_AddBills', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019132931_AddUserTypeAndShopProfile'
)
BEGIN
    ALTER TABLE [AspNetUsers] ADD [UserType] tinyint NOT NULL DEFAULT CAST(0 AS tinyint);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019132931_AddUserTypeAndShopProfile'
)
BEGIN
    CREATE TABLE [ShopProfiles] (
        [UserId] uniqueidentifier NOT NULL,
        [ShopName] nvarchar(100) NOT NULL,
        [City] nvarchar(100) NULL,
        [Address] nvarchar(200) NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_ShopProfiles] PRIMARY KEY ([UserId]),
        CONSTRAINT [FK_ShopProfiles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019132931_AddUserTypeAndShopProfile'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261019132931_AddUserTypeAndShopProfile', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019133702_AddMarketplaceQuotations'
)
BEGIN
    CREATE TABLE [QuotationRequests] (
        [Id] uniqueidentifier NOT NULL,
        [CustomerUserId] uniqueidentifier NOT NULL,
        [Status] tinyint NOT NULL,
        [ItemsJson] nvarchar(4000) NOT NULL,
        [Notes] nvarchar(500) NULL,
        [AcceptedQuoteId] uniqueidentifier NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_QuotationRequests] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_QuotationRequests_AspNetUsers_CustomerUserId] FOREIGN KEY ([CustomerUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019133702_AddMarketplaceQuotations'
)
BEGIN
    CREATE TABLE [QuotationRequestShopTargets] (
        [Id] uniqueidentifier NOT NULL,
        [QuotationRequestId] uniqueidentifier NOT NULL,
        [ShopUserId] uniqueidentifier NOT NULL,
        [Status] tinyint NOT NULL,
        CONSTRAINT [PK_QuotationRequestShopTargets] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_QuotationRequestShopTargets_AspNetUsers_ShopUserId] FOREIGN KEY ([ShopUserId]) REFERENCES [AspNetUsers] ([Id]),
        CONSTRAINT [FK_QuotationRequestShopTargets_QuotationRequests_QuotationRequestId] FOREIGN KEY ([QuotationRequestId]) REFERENCES [QuotationRequests] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019133702_AddMarketplaceQuotations'
)
BEGIN
    CREATE TABLE [Quotes] (
        [Id] uniqueidentifier NOT NULL,
        [QuotationRequestId] uniqueidentifier NOT NULL,
        [ShopUserId] uniqueidentifier NOT NULL,
        [Status] tinyint NOT NULL,
        [ItemsJson] nvarchar(4000) NOT NULL,
        [TotalAmount] decimal(10,2) NOT NULL,
        [Note] nvarchar(300) NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_Quotes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Quotes_AspNetUsers_ShopUserId] FOREIGN KEY ([ShopUserId]) REFERENCES [AspNetUsers] ([Id]),
        CONSTRAINT [FK_Quotes_QuotationRequests_QuotationRequestId] FOREIGN KEY ([QuotationRequestId]) REFERENCES [QuotationRequests] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019133702_AddMarketplaceQuotations'
)
BEGIN
    CREATE INDEX [IX_QuotationRequests_AcceptedQuoteId] ON [QuotationRequests] ([AcceptedQuoteId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019133702_AddMarketplaceQuotations'
)
BEGIN
    CREATE INDEX [IX_QuotationRequests_CustomerUserId_CreatedAt] ON [QuotationRequests] ([CustomerUserId], [CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019133702_AddMarketplaceQuotations'
)
BEGIN
    CREATE INDEX [IX_QuotationRequestShopTargets_QuotationRequestId] ON [QuotationRequestShopTargets] ([QuotationRequestId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019133702_AddMarketplaceQuotations'
)
BEGIN
    CREATE UNIQUE INDEX [IX_QuotationRequestShopTargets_ShopUserId_QuotationRequestId] ON [QuotationRequestShopTargets] ([ShopUserId], [QuotationRequestId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019133702_AddMarketplaceQuotations'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Quotes_QuotationRequestId_ShopUserId] ON [Quotes] ([QuotationRequestId], [ShopUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019133702_AddMarketplaceQuotations'
)
BEGIN
    CREATE INDEX [IX_Quotes_ShopUserId] ON [Quotes] ([ShopUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019133702_AddMarketplaceQuotations'
)
BEGIN
    ALTER TABLE [QuotationRequests] ADD CONSTRAINT [FK_QuotationRequests_Quotes_AcceptedQuoteId] FOREIGN KEY ([AcceptedQuoteId]) REFERENCES [Quotes] ([Id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261019133702_AddMarketplaceQuotations'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261019133702_AddMarketplaceQuotations', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020110601_AddHealthMedicines'
)
BEGIN
    CREATE TABLE [HouseholdMembers] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Name] nvarchar(50) NOT NULL,
        [Relation] nvarchar(30) NOT NULL,
        [AvatarEmoji] nvarchar(10) NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_HouseholdMembers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_HouseholdMembers_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020110601_AddHealthMedicines'
)
BEGIN
    CREATE TABLE [Medicines] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [MemberId] uniqueidentifier NOT NULL,
        [PrescriptionId] uniqueidentifier NULL,
        [Name] nvarchar(100) NOT NULL,
        [Mode] tinyint NOT NULL,
        [CourseDays] int NULL,
        [MorningQty] int NOT NULL,
        [AfternoonQty] int NOT NULL,
        [EveningQty] int NOT NULL,
        [NightQty] int NOT NULL,
        [FoodTiming] tinyint NOT NULL,
        [StockCount] int NOT NULL,
        [StartDate] date NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_Medicines] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Medicines_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Medicines_HouseholdMembers_MemberId] FOREIGN KEY ([MemberId]) REFERENCES [HouseholdMembers] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020110601_AddHealthMedicines'
)
BEGIN
    CREATE TABLE [DoseLogs] (
        [Id] uniqueidentifier NOT NULL,
        [MedicineId] uniqueidentifier NOT NULL,
        [Date] date NOT NULL,
        [Slot] tinyint NOT NULL,
        [Status] tinyint NOT NULL,
        [TakenAt] datetimeoffset NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_DoseLogs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DoseLogs_Medicines_MedicineId] FOREIGN KEY ([MedicineId]) REFERENCES [Medicines] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020110601_AddHealthMedicines'
)
BEGIN
    CREATE UNIQUE INDEX [IX_DoseLogs_MedicineId_Date_Slot] ON [DoseLogs] ([MedicineId], [Date], [Slot]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020110601_AddHealthMedicines'
)
BEGIN
    CREATE INDEX [IX_HouseholdMembers_UserId] ON [HouseholdMembers] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020110601_AddHealthMedicines'
)
BEGIN
    CREATE INDEX [IX_Medicines_MemberId] ON [Medicines] ([MemberId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020110601_AddHealthMedicines'
)
BEGIN
    CREATE INDEX [IX_Medicines_UserId_MemberId] ON [Medicines] ([UserId], [MemberId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020110601_AddHealthMedicines'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261020110601_AddHealthMedicines', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020114417_AddPrescriptions'
)
BEGIN
    CREATE TABLE [Prescriptions] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [MemberId] uniqueidentifier NOT NULL,
        [DoctorName] nvarchar(100) NOT NULL,
        [DoctorSpecialty] nvarchar(100) NULL,
        [VisitDate] date NOT NULL,
        [RevisitDate] date NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_Prescriptions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Prescriptions_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Prescriptions_HouseholdMembers_MemberId] FOREIGN KEY ([MemberId]) REFERENCES [HouseholdMembers] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020114417_AddPrescriptions'
)
BEGIN
    CREATE INDEX [IX_Medicines_PrescriptionId] ON [Medicines] ([PrescriptionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020114417_AddPrescriptions'
)
BEGIN
    CREATE INDEX [IX_Prescriptions_MemberId] ON [Prescriptions] ([MemberId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020114417_AddPrescriptions'
)
BEGIN
    CREATE INDEX [IX_Prescriptions_UserId_MemberId] ON [Prescriptions] ([UserId], [MemberId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020114417_AddPrescriptions'
)
BEGIN
    ALTER TABLE [Medicines] ADD CONSTRAINT [FK_Medicines_Prescriptions_PrescriptionId] FOREIGN KEY ([PrescriptionId]) REFERENCES [Prescriptions] ([Id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020114417_AddPrescriptions'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261020114417_AddPrescriptions', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020165250_AddShopServedCategories'
)
BEGIN
    ALTER TABLE [ShopProfiles] ADD [ServedCategoryKeysJson] nvarchar(1000) NOT NULL DEFAULT N'[]';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020165250_AddShopServedCategories'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261020165250_AddShopServedCategories', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020172338_AddShopPriceListAndQuoteDelivery'
)
BEGIN
    DECLARE @var nvarchar(max);
    SELECT @var = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ShopProfiles]') AND [c].[name] = N'ServedCategoryKeysJson');
    IF @var IS NOT NULL EXEC(N'ALTER TABLE [ShopProfiles] DROP CONSTRAINT ' + @var + ';');
    ALTER TABLE [ShopProfiles] ADD DEFAULT N'[]' FOR [ServedCategoryKeysJson];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020172338_AddShopPriceListAndQuoteDelivery'
)
BEGIN
    ALTER TABLE [ShopProfiles] ADD [PriceListJson] nvarchar(max) NOT NULL DEFAULT N'{}';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020172338_AddShopPriceListAndQuoteDelivery'
)
BEGIN
    ALTER TABLE [Quotes] ADD [DeliveryChargeAmount] decimal(10,2) NOT NULL DEFAULT 0.0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020172338_AddShopPriceListAndQuoteDelivery'
)
BEGIN
    ALTER TABLE [Quotes] ADD [EstimatedDeliveryMinutes] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020172338_AddShopPriceListAndQuoteDelivery'
)
BEGIN
    ALTER TABLE [Quotes] ADD [ValidUntil] datetimeoffset NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020172338_AddShopPriceListAndQuoteDelivery'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261020172338_AddShopPriceListAndQuoteDelivery', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020172944_AddQuotationRequestCloseWindow'
)
BEGIN
    ALTER TABLE [QuotationRequests] ADD [QuotesCloseAt] datetimeoffset NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020172944_AddQuotationRequestCloseWindow'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261020172944_AddQuotationRequestCloseWindow', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020173747_AddQuoteFulfillment'
)
BEGIN
    ALTER TABLE [Quotes] ADD [FulfillmentStatus] tinyint NOT NULL DEFAULT CAST(0 AS tinyint);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020173747_AddQuoteFulfillment'
)
BEGIN
    ALTER TABLE [Quotes] ADD [PackedItemKeysJson] nvarchar(2000) NOT NULL DEFAULT N'[]';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020173747_AddQuoteFulfillment'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261020173747_AddQuoteFulfillment', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021093745_AddShopProfileDetails'
)
BEGIN
    ALTER TABLE [ShopProfiles] ADD [ClosesAt] time NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021093745_AddShopProfileDetails'
)
BEGIN
    ALTER TABLE [ShopProfiles] ADD [ContactPhonesJson] nvarchar(500) NOT NULL DEFAULT N'[]';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021093745_AddShopProfileDetails'
)
BEGIN
    ALTER TABLE [ShopProfiles] ADD [ImageUrl] nvarchar(300) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021093745_AddShopProfileDetails'
)
BEGIN
    ALTER TABLE [ShopProfiles] ADD [Latitude] decimal(9,6) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021093745_AddShopProfileDetails'
)
BEGIN
    ALTER TABLE [ShopProfiles] ADD [Longitude] decimal(9,6) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021093745_AddShopProfileDetails'
)
BEGIN
    ALTER TABLE [ShopProfiles] ADD [OpenDaysJson] nvarchar(100) NOT NULL DEFAULT N'[]';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021093745_AddShopProfileDetails'
)
BEGIN
    ALTER TABLE [ShopProfiles] ADD [OpensAt] time NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021093745_AddShopProfileDetails'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261021093745_AddShopProfileDetails', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021121818_AddProviderLinks'
)
BEGIN
    CREATE TABLE [ProviderLinks] (
        [Id] uniqueidentifier NOT NULL,
        [HouseholdUserId] uniqueidentifier NOT NULL,
        [ServiceContactId] uniqueidentifier NOT NULL,
        [Category] tinyint NOT NULL,
        [InviteCode] nvarchar(12) NOT NULL,
        [ProviderUserId] uniqueidentifier NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [ClaimedAt] datetimeoffset NULL,
        [RevokedAt] datetimeoffset NULL,
        CONSTRAINT [PK_ProviderLinks] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProviderLinks_AspNetUsers_HouseholdUserId] FOREIGN KEY ([HouseholdUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ProviderLinks_AspNetUsers_ProviderUserId] FOREIGN KEY ([ProviderUserId]) REFERENCES [AspNetUsers] ([Id]),
        CONSTRAINT [FK_ProviderLinks_ServiceContacts_ServiceContactId] FOREIGN KEY ([ServiceContactId]) REFERENCES [ServiceContacts] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021121818_AddProviderLinks'
)
BEGIN
    CREATE INDEX [IX_ProviderLinks_HouseholdUserId_ServiceContactId] ON [ProviderLinks] ([HouseholdUserId], [ServiceContactId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021121818_AddProviderLinks'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ProviderLinks_InviteCode] ON [ProviderLinks] ([InviteCode]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021121818_AddProviderLinks'
)
BEGIN
    CREATE INDEX [IX_ProviderLinks_ProviderUserId_Category_RevokedAt] ON [ProviderLinks] ([ProviderUserId], [Category], [RevokedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021121818_AddProviderLinks'
)
BEGIN
    CREATE INDEX [IX_ProviderLinks_ServiceContactId] ON [ProviderLinks] ([ServiceContactId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021121818_AddProviderLinks'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261021121818_AddProviderLinks', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021131037_AddMilkProviderAttribution'
)
BEGIN
    ALTER TABLE [MilkExtraRequests] ADD [AddedByProviderId] uniqueidentifier NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021131037_AddMilkProviderAttribution'
)
BEGIN
    ALTER TABLE [MilkExtraRequests] ADD [SeenByHouseholdAt] datetimeoffset NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021131037_AddMilkProviderAttribution'
)
BEGIN
    ALTER TABLE [MilkDeliveryOverrides] ADD [AddedByProviderId] uniqueidentifier NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021131037_AddMilkProviderAttribution'
)
BEGIN
    ALTER TABLE [MilkDeliveryOverrides] ADD [SeenByHouseholdAt] datetimeoffset NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021131037_AddMilkProviderAttribution'
)
BEGIN
    CREATE INDEX [IX_MilkExtraRequests_AddedByProviderId] ON [MilkExtraRequests] ([AddedByProviderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021131037_AddMilkProviderAttribution'
)
BEGIN
    CREATE INDEX [IX_MilkDeliveryOverrides_AddedByProviderId] ON [MilkDeliveryOverrides] ([AddedByProviderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021131037_AddMilkProviderAttribution'
)
BEGIN
    ALTER TABLE [MilkDeliveryOverrides] ADD CONSTRAINT [FK_MilkDeliveryOverrides_AspNetUsers_AddedByProviderId] FOREIGN KEY ([AddedByProviderId]) REFERENCES [AspNetUsers] ([Id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021131037_AddMilkProviderAttribution'
)
BEGIN
    ALTER TABLE [MilkExtraRequests] ADD CONSTRAINT [FK_MilkExtraRequests_AspNetUsers_AddedByProviderId] FOREIGN KEY ([AddedByProviderId]) REFERENCES [AspNetUsers] ([Id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021131037_AddMilkProviderAttribution'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261021131037_AddMilkProviderAttribution', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021132757_AddManualCustomersAndPickupRequests'
)
BEGIN
    CREATE TABLE [LaundryPickupRequests] (
        [Id] uniqueidentifier NOT NULL,
        [HouseholdUserId] uniqueidentifier NOT NULL,
        [ProviderUserId] uniqueidentifier NOT NULL,
        [RequestedDate] date NOT NULL,
        [Note] nvarchar(200) NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [HandledAt] datetimeoffset NULL,
        CONSTRAINT [PK_LaundryPickupRequests] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_LaundryPickupRequests_AspNetUsers_HouseholdUserId] FOREIGN KEY ([HouseholdUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_LaundryPickupRequests_AspNetUsers_ProviderUserId] FOREIGN KEY ([ProviderUserId]) REFERENCES [AspNetUsers] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021132757_AddManualCustomersAndPickupRequests'
)
BEGIN
    CREATE TABLE [ProviderCustomers] (
        [Id] uniqueidentifier NOT NULL,
        [ProviderUserId] uniqueidentifier NOT NULL,
        [Category] tinyint NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [Phone] nvarchar(20) NULL,
        [Address] nvarchar(200) NULL,
        [Notes] nvarchar(500) NULL,
        [LinkCode] nvarchar(12) NULL,
        [ClaimedByUserId] uniqueidentifier NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [ArchivedAt] datetimeoffset NULL,
        CONSTRAINT [PK_ProviderCustomers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProviderCustomers_AspNetUsers_ClaimedByUserId] FOREIGN KEY ([ClaimedByUserId]) REFERENCES [AspNetUsers] ([Id]),
        CONSTRAINT [FK_ProviderCustomers_AspNetUsers_ProviderUserId] FOREIGN KEY ([ProviderUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021132757_AddManualCustomersAndPickupRequests'
)
BEGIN
    CREATE TABLE [ManualLaundryBatches] (
        [Id] uniqueidentifier NOT NULL,
        [ProviderCustomerId] uniqueidentifier NOT NULL,
        [ServiceType] tinyint NOT NULL,
        [GivenOn] date NOT NULL,
        [ExpectedReturn] date NULL,
        [Status] tinyint NOT NULL,
        [PickedUpOn] date NULL,
        [Amount] decimal(8,2) NULL,
        [IsPaid] bit NOT NULL,
        [PaidAt] datetimeoffset NULL,
        [ItemsJson] nvarchar(2000) NOT NULL,
        [Notes] nvarchar(200) NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_ManualLaundryBatches] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ManualLaundryBatches_ProviderCustomers_ProviderCustomerId] FOREIGN KEY ([ProviderCustomerId]) REFERENCES [ProviderCustomers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021132757_AddManualCustomersAndPickupRequests'
)
BEGIN
    CREATE TABLE [ManualMilkEntries] (
        [Id] uniqueidentifier NOT NULL,
        [ProviderCustomerId] uniqueidentifier NOT NULL,
        [Date] date NOT NULL,
        [QuantityLtr] decimal(5,2) NOT NULL,
        [RatePerLtr] decimal(8,2) NOT NULL,
        [IsExtra] bit NOT NULL,
        [Note] nvarchar(200) NULL,
        [IsPaid] bit NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_ManualMilkEntries] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ManualMilkEntries_ProviderCustomers_ProviderCustomerId] FOREIGN KEY ([ProviderCustomerId]) REFERENCES [ProviderCustomers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021132757_AddManualCustomersAndPickupRequests'
)
BEGIN
    CREATE INDEX [IX_LaundryPickupRequests_HouseholdUserId] ON [LaundryPickupRequests] ([HouseholdUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021132757_AddManualCustomersAndPickupRequests'
)
BEGIN
    CREATE INDEX [IX_LaundryPickupRequests_ProviderUserId_HandledAt] ON [LaundryPickupRequests] ([ProviderUserId], [HandledAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021132757_AddManualCustomersAndPickupRequests'
)
BEGIN
    CREATE INDEX [IX_ManualLaundryBatches_ProviderCustomerId_Status] ON [ManualLaundryBatches] ([ProviderCustomerId], [Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021132757_AddManualCustomersAndPickupRequests'
)
BEGIN
    CREATE INDEX [IX_ManualMilkEntries_ProviderCustomerId_Date_IsExtra] ON [ManualMilkEntries] ([ProviderCustomerId], [Date], [IsExtra]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021132757_AddManualCustomersAndPickupRequests'
)
BEGIN
    CREATE INDEX [IX_ProviderCustomers_ClaimedByUserId] ON [ProviderCustomers] ([ClaimedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021132757_AddManualCustomersAndPickupRequests'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_ProviderCustomers_LinkCode] ON [ProviderCustomers] ([LinkCode]) WHERE [LinkCode] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021132757_AddManualCustomersAndPickupRequests'
)
BEGIN
    CREATE INDEX [IX_ProviderCustomers_ProviderUserId_ArchivedAt] ON [ProviderCustomers] ([ProviderUserId], [ArchivedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021132757_AddManualCustomersAndPickupRequests'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261021132757_AddManualCustomersAndPickupRequests', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021150945_AddManualMilkEntrySlot'
)
BEGIN
    DROP INDEX [IX_ManualMilkEntries_ProviderCustomerId_Date_IsExtra] ON [ManualMilkEntries];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021150945_AddManualMilkEntrySlot'
)
BEGIN
    ALTER TABLE [ManualMilkEntries] ADD [Slot] tinyint NOT NULL DEFAULT CAST(0 AS tinyint);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021150945_AddManualMilkEntrySlot'
)
BEGIN
    CREATE INDEX [IX_ManualMilkEntries_ProviderCustomerId_Date_Slot_IsExtra] ON [ManualMilkEntries] ([ProviderCustomerId], [Date], [Slot], [IsExtra]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021150945_AddManualMilkEntrySlot'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261021150945_AddManualMilkEntrySlot', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021151407_AddManualCustomerMilkDefaults'
)
BEGIN
    ALTER TABLE [ProviderCustomers] ADD [DefaultQuantityLtr] decimal(5,2) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021151407_AddManualCustomerMilkDefaults'
)
BEGIN
    ALTER TABLE [ProviderCustomers] ADD [DefaultRatePerLtr] decimal(8,2) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021151407_AddManualCustomerMilkDefaults'
)
BEGIN
    ALTER TABLE [ProviderCustomers] ADD [DefaultSlot] tinyint NOT NULL DEFAULT CAST(0 AS tinyint);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021151407_AddManualCustomerMilkDefaults'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261021151407_AddManualCustomerMilkDefaults', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021155736_AddManualMilkVarietyAndReturns'
)
BEGIN
    DROP INDEX [IX_ManualMilkEntries_ProviderCustomerId_Date_Slot_IsExtra] ON [ManualMilkEntries];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021155736_AddManualMilkVarietyAndReturns'
)
BEGIN
    DECLARE @var1 nvarchar(max);
    SELECT @var1 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ManualMilkEntries]') AND [c].[name] = N'IsExtra');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [ManualMilkEntries] DROP CONSTRAINT ' + @var1 + ';');
    ALTER TABLE [ManualMilkEntries] DROP COLUMN [IsExtra];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021155736_AddManualMilkVarietyAndReturns'
)
BEGIN
    ALTER TABLE [ProviderCustomers] ADD [DefaultVariety] nvarchar(50) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021155736_AddManualMilkVarietyAndReturns'
)
BEGIN
    ALTER TABLE [ManualMilkEntries] ADD [Kind] tinyint NOT NULL DEFAULT CAST(0 AS tinyint);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021155736_AddManualMilkVarietyAndReturns'
)
BEGIN
    ALTER TABLE [ManualMilkEntries] ADD [Variety] nvarchar(50) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021155736_AddManualMilkVarietyAndReturns'
)
BEGIN
    CREATE INDEX [IX_ManualMilkEntries_ProviderCustomerId_Date_Slot_Variety_Kind] ON [ManualMilkEntries] ([ProviderCustomerId], [Date], [Slot], [Variety], [Kind]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021155736_AddManualMilkVarietyAndReturns'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261021155736_AddManualMilkVarietyAndReturns', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021162718_AddMilkSelfCollected'
)
BEGIN
    ALTER TABLE [MilkSubscriptions] ADD [IsSelfCollected] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021162718_AddMilkSelfCollected'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261021162718_AddMilkSelfCollected', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021164301_AddMilkPayments'
)
BEGIN
    CREATE TABLE [MilkPayments] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Date] date NOT NULL,
        [Amount] decimal(10,2) NOT NULL,
        [Note] nvarchar(200) NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_MilkPayments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MilkPayments_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021164301_AddMilkPayments'
)
BEGIN
    CREATE INDEX [IX_MilkPayments_UserId_Date] ON [MilkPayments] ([UserId], [Date]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261021164301_AddMilkPayments'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261021164301_AddMilkPayments', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022043731_AddUpiPayments'
)
BEGIN
    ALTER TABLE [MilkPayments] ADD [ConfirmedAt] datetimeoffset NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022043731_AddUpiPayments'
)
BEGIN
    ALTER TABLE [MilkPayments] ADD [Method] tinyint NOT NULL DEFAULT CAST(0 AS tinyint);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022043731_AddUpiPayments'
)
BEGIN
    ALTER TABLE [MilkPayments] ADD [Status] tinyint NOT NULL DEFAULT CAST(0 AS tinyint);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022043731_AddUpiPayments'
)
BEGIN
    ALTER TABLE [AspNetUsers] ADD [UpiId] nvarchar(100) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022043731_AddUpiPayments'
)
BEGIN
    CREATE INDEX [IX_MilkPayments_Status] ON [MilkPayments] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022043731_AddUpiPayments'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261022043731_AddUpiPayments', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022080211_AddLaundryBatchPhoto'
)
BEGIN
    ALTER TABLE [LaundryBatches] ADD [PhotoUrl] nvarchar(300) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261022080211_AddLaundryBatchPhoto'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261022080211_AddLaundryBatchPhoto', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024171602_AddMedicinePurposeAndNextVisit'
)
BEGIN
    ALTER TABLE [Medicines] ADD [NextVisitDate] date NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024171602_AddMedicinePurposeAndNextVisit'
)
BEGIN
    ALTER TABLE [Medicines] ADD [Purpose] nvarchar(100) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024171602_AddMedicinePurposeAndNextVisit'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261024171602_AddMedicinePurposeAndNextVisit', N'10.0.13');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261029145503_AddShopOwnerPhoto'
)
BEGIN
    ALTER TABLE [ShopProfiles] ADD [OwnerPhotoUrl] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261029145503_AddShopOwnerPhoto'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261029145503_AddShopOwnerPhoto', N'10.0.13');
END;

COMMIT;
GO

