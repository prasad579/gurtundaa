# gurtundaa? 💭

> your memory bestie. reminders that actually vibe, on the web and on your phone.

*gurtundaa?* is Telugu for "remember?". That's the whole job of this app: remember things so you don't have to.

## Stack

| Layer | Tech |
|---|---|
| API | .NET 10 Web API, ASP.NET Identity, JWT access + rotating refresh tokens |
| Database | SQL Server (manage with SSMS), EF Core 10 code-first migrations |
| Web | Angular 21 (standalone, zoneless, signals) |
| Mobile | Ionic 9 + Capacitor 8 (Android now, iOS needs a Mac) |
| Shared | `@gurtundaa/shared`: API client, models, auth, interceptor, guards, brand copy |

## Repo layout

```
server/                     .NET solution (Gurtundaa.sln)
  src/Gurtundaa.Domain          entities: AppUser, Reminder, RefreshToken
  src/Gurtundaa.Application     DTOs + service interfaces (no EF / web dependencies)
  src/Gurtundaa.Infrastructure  EF Core DbContext, migrations, auth + reminder services
  src/Gurtundaa.Api             controllers, JWT/CORS setup, Program.cs
client/                     Angular workspace (one package.json for everything)
  projects/web                  web app
  projects/mobile               Ionic + Capacitor app (android/ lives in here)
  projects/shared               library both apps import as @gurtundaa/shared
  capacitor.config.ts
database/                   SQL scripts for SSMS (generated from the EF migrations)
```

## Prerequisites

- .NET SDK 10
- Node 22.12+ (Angular 21). Upgrading to Node 22.22.3+ unlocks Angular 22.
- SQL Server (local default instance `localhost` is assumed) + SSMS
- Android Studio, for running the mobile app on an emulator/phone

## First run

### 1. API

```bash
cd server
# JWT signing key: kept out of git on purpose. Any random string of 32+ chars.
dotnet user-secrets set "Jwt:SigningKey" "<random-32+-char-secret>" --project src/Gurtundaa.Api
dotnet run --project src/Gurtundaa.Api --launch-profile http
```

The API listens on **http://localhost:5080**. In Development it applies EF migrations on startup, so `GurtundaaDb` gets created on your local SQL Server automatically. Health check: `GET http://localhost:5080/api/health`. The OpenAPI doc is at `/openapi/v1.json`.

The connection string is in `server/src/Gurtundaa.Api/appsettings.Development.json` (`Server=localhost;Database=GurtundaaDb;Trusted_Connection=True`). Change it there if your SQL Server uses a named instance or SQL auth.

### 2. Web

```bash
cd client
npm install
npm run start:web        # http://localhost:4200
```

### 3. Mobile

```bash
cd client
npm run start:mobile     # browser preview at http://localhost:8100
npm run cap:android      # build, sync and open the Android project in Android Studio
```

- The Android emulator talks to the API via `10.0.2.2:5080` (see `projects/mobile/src/environments/environment.ts`). On a real phone, use your PC's LAN IP and open port 5080 in the firewall.
- Reminders with a due time are scheduled as **local notifications** on the device, so your phone buzzes even when the app is closed.
- iOS: on a Mac run `npx cap add ios`, then `npx cap open ios`.

## Database / SSMS

See [database/README.md](database/README.md). Short version: change the model → `dotnet ef migrations add <Name>` → regenerate the idempotent script → review/run it in SSMS for non-dev environments.

## API

| Method | Route | Notes |
|---|---|---|
| POST | `/api/auth/register` | `{ email, password, displayName }` → tokens + user |
| POST | `/api/auth/login` | `{ email, password }`; 5 failed attempts lock the account for 10 min |
| POST | `/api/auth/refresh` | `{ refreshToken }`; single-use, rotated every call |
| POST | `/api/auth/logout` | `{ refreshToken }` revokes it |
| GET | `/api/auth/me` | current user |
| GET | `/api/reminders?filter=All\|Upcoming\|Overdue\|Done` | the signed-in user's reminders only |
| GET | `/api/reminders/stats` | counts for the dashboard |
| POST / PUT | `/api/reminders`, `/api/reminders/{id}` | `{ title, notes?, dueAt?, priority: Chill\|Normal\|Urgent }` |
| PATCH | `/api/reminders/{id}/done?value=true` | mark done / undone |
| DELETE | `/api/reminders/{id}` | |

## Scripts (client)

| Command | Does |
|---|---|
| `npm run start:web` / `start:mobile` | dev servers on 4200 / 8100 |
| `npm run build` | production builds of both apps |
| `npm test` | unit tests for the shared library (Vitest) |
| `npm run cap:sync` | build mobile + copy into the native projects |
| `npm run format` | Prettier |

## Brand

Name **gurtundaa?** (always lowercase, with the `?`), emoji 💭, tagline *your memory bestie*. Gradient `#7c3aed → #ec4899 → #f97316`. Brand copy (greetings, empty states, cheers) lives in `client/projects/shared/src/lib/util/vibes.ts` so web and mobile sound the same.
