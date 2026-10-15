# Database (SQL Server + SSMS)

The schema is owned by **EF Core migrations** in `server/src/Gurtundaa.Infrastructure/Persistence/Migrations`.
The `.sql` files in `migrations/` are generated from them, so DBAs and SSMS users can review and run the exact same changes.

## Connect in SSMS

- Server name: `localhost` (the default local instance), Windows Authentication
- Database: `GurtundaaDb`. Created automatically the first time the API runs in Development.

Tables: `Reminders`, `RefreshTokens` (hashes only, never raw tokens), and the standard ASP.NET Identity `AspNet*` tables. `__EFMigrationsHistory` records which migrations have been applied.

## Changing the schema

```bash
cd server

# 1. Change the entities / configurations, then add a migration
dotnet ef migrations add <DescriptiveName> \
  --project src/Gurtundaa.Infrastructure --startup-project src/Gurtundaa.Api \
  --output-dir Persistence/Migrations

# 2. Regenerate the reviewable SQL script (idempotent: safe to run more than once)
dotnet ef migrations script --idempotent \
  --project src/Gurtundaa.Infrastructure --startup-project src/Gurtundaa.Api \
  --output ../database/migrations/<NNNN>_<DescriptiveName>.sql
```

Use `--idempotent` with a `<from>` migration name if you only want the new changes in the script.

## Environments

| Environment | How the schema gets applied |
|---|---|
| Development | automatically on API startup (`Database.MigrateAsync()` in `Program.cs`) |
| QA / Prod | run the reviewed script from `migrations/` in SSMS (or a pipeline step). The API does **not** migrate outside Development. |

## Handy queries

```sql
SELECT MigrationId FROM __EFMigrationsHistory ORDER BY MigrationId;

-- Reminders per user
SELECT u.Email, COUNT(r.Id) AS Reminders, SUM(CASE WHEN r.IsDone = 1 THEN 1 ELSE 0 END) AS Done
FROM AspNetUsers u
LEFT JOIN Reminders r ON r.UserId = u.Id
GROUP BY u.Email;
```
