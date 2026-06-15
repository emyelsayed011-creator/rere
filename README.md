# Samsary

A full-stack listings platform — post items for **Sell** or **Rent** with images and short videos, chat in real time, get notifications, and moderate posts from an admin dashboard.

- **Backend:** ASP.NET Core 9 Web API · EF Core (PostgreSQL) · ASP.NET Identity + JWT · SignalR · Serilog · Cloudinary
- **Frontend:** Angular 21 (standalone, signals, zoneless) · Bootstrap 5 + Bootstrap Icons · SignalR client

---

## What's included

### Security
- ASP.NET Identity with strong password policy (min 8, uppercase, digit, symbol)
- Account lockout after 5 failed sign-ins (15 min)
- JWT bearer auth on REST + SignalR (token via `access_token` query for hubs)
- Role-based authorization (`User`, `Admin`)
- Admin user can **block / unblock** accounts
- CORS scoped to the Angular dev origin
- HTTPS redirection enabled in non-dev
- Request size limits configured (200 MB cap for video uploads)

### Listings
- Categories (Apartments, Houses, Vehicles, Electronics, Furniture, Other — seeded)
- Listing type: **Sell** or **Rent**
- Multiple images + one or more videos per listing
- **Videos > 5 minutes are rejected automatically** (Cloudinary returns duration; over-length uploads are deleted server-side)
- Listings start as **Pending** → must be **Approved** by an admin before becoming public
- Editing a listing puts it back to Pending (admins can edit without re-moderation)

### Chat
- Real-time 1-to-1 chat via SignalR hub at `/hubs/chat`
- Conversation list with unread counts
- Read receipts
- Auto-creates a **NewMessage** notification for the receiver

### Notifications
- Real-time in-app via SignalR hub at `/hubs/notifications`
- Email via MailKit (SMTP) — falls back to no-op log if not configured
- SMS interface (`ISmsService`) — stubbed; wire Twilio by populating `Sms` settings and implementing the call
- Notification types: ListingApproved, ListingRejected, NewMessage, Admin, System

### Admin panel
- Dashboard with live counters (users, listings, pending, etc.)
- Moderate pending listings (approve / reject with reason → emails the owner)
- User table with block/unblock
- **Send a direct message** from admin to any user (creates a chat message + notification + email)
- System logs viewer (every API call is logged to DB + Serilog file)

### Logging
- Serilog console + rolling file (`Samsary.Api/Logs/`)
- Custom `RequestLoggingMiddleware` writes a row to `SystemLogs` for every API request and exception

---

## Prerequisites

| Tool | Version |
|------|---------|
| .NET SDK | 9.0+ |
| Node.js | 20+ |
| Angular CLI | 21+ |
| PostgreSQL | 13+ (local install, Docker, or hosted) |
| Cloudinary account | free tier — https://cloudinary.com |

---

## Configure secrets

Edit `Samsary.Api/appsettings.json` (or override with `appsettings.Development.json` / env vars / user-secrets):

1. **`Jwt:SigningKey`** — replace with a long random string (64+ chars).
2. **`ConnectionStrings:Default`** — point to your Postgres instance.
3. **`Cloudinary`** — paste `CloudName`, `ApiKey`, `ApiSecret` from the Cloudinary dashboard.
4. **`Email`** *(optional but recommended)* — SMTP credentials (Gmail App Password / SendGrid SMTP / Mailtrap).
5. **`Sms`** *(optional)* — Twilio credentials.
6. **`Seed:AdminPassword`** — change before first run (default is `Admin#12345`).

### Recommended: use User Secrets

```powershell
cd Samsary.Api
dotnet user-secrets init
dotnet user-secrets set "Cloudinary:CloudName" "your-cloud-name"
dotnet user-secrets set "Cloudinary:ApiKey"    "your-api-key"
dotnet user-secrets set "Cloudinary:ApiSecret" "your-api-secret"
dotnet user-secrets set "Jwt:SigningKey"       "$(([System.Guid]::NewGuid().ToString()+[System.Guid]::NewGuid().ToString()))"
```

---

## Run the backend

```powershell
cd Samsary.Api
# Migrations are applied automatically on startup. To inspect / generate manually:
# dotnet ef migrations add <Name>
# dotnet ef database update

dotnet run
```

API will listen on:
- HTTP: http://localhost:5013
- HTTPS: https://localhost:7094
- OpenAPI: http://localhost:5013/openapi/v1.json

A default admin is seeded:
- **Email:** `admin@samsary.local`
- **Password:** `Admin#12345` (change in `appsettings.json` `Seed:AdminPassword` before first run)

---

## Run the Angular app

```powershell
cd samsary-web
npm install      # only first time
npm start
```

App runs at http://localhost:4200 and proxies `/api` + `/hubs` to the backend (see `proxy.conf.json`).

---

## Project structure

```
Samsary/
├── Samsary.sln
├── Samsary.Api/                 .NET 9 Web API
│   ├── Configuration/           Strongly-typed options (Jwt, Cloudinary, Email, Sms)
│   ├── Controllers/             Auth, Users, Listings, Categories, Chat, Notifications, Admin
│   ├── Data/                    DbContext + SeedData
│   ├── DTOs/                    Request/response shapes
│   ├── Hubs/                    ChatHub, NotificationHub (SignalR)
│   ├── Middleware/              RequestLoggingMiddleware
│   ├── Migrations/              EF Core migrations
│   ├── Models/                  Domain entities + enums
│   ├── Services/                Cloudinary, Email, Sms, Jwt, Notification services
│   ├── Logs/                    Serilog rolling files (created at runtime)
│   ├── appsettings.json
│   └── Program.cs
└── samsary-web/                 Angular 21 SPA
    ├── proxy.conf.json
    └── src/app/
        ├── core/                Auth, guards, interceptor, API + realtime services
        ├── shared/              Navbar
        ├── features/
        │   ├── home.ts
        │   ├── auth/            login, register
        │   ├── listings/        list, detail, form
        │   ├── chat.ts
        │   ├── notifications.ts
        │   ├── profile.ts
        │   └── admin/           shell, dashboard, moderate, users, logs
        ├── app.config.ts
        └── app.routes.ts
```

---

## Notable endpoints

| Method | Route | Auth |
|--------|-------|------|
| POST | `/api/auth/register` | anonymous |
| POST | `/api/auth/login` | anonymous |
| GET | `/api/categories` | anonymous |
| GET | `/api/listings?q=&categoryId=&type=&page=&pageSize=` | anonymous |
| GET | `/api/listings/{id}` | anonymous |
| POST | `/api/listings` | user |
| POST | `/api/listings/{id}/media/image` | user (owner) |
| POST | `/api/listings/{id}/media/video` | user (owner) — rejects > 5 min |
| GET | `/api/users/me` · `PUT /api/users/me` · `POST /api/users/me/avatar` · `POST /api/users/me/change-password` | user |
| GET | `/api/chat/conversations` · `GET /api/chat/with/{userId}` | user |
| GET | `/api/notifications?unreadOnly=` · `POST /api/notifications/{id}/read` · `POST /api/notifications/read-all` | user |
| GET | `/api/admin/dashboard` · `GET /api/admin/listings/pending` · `POST /api/admin/listings/{id}/approve` · `POST /api/admin/listings/{id}/reject` | admin |
| GET | `/api/admin/users` · `POST /api/admin/users/{id}/block` · `POST /api/admin/users/{id}/message` | admin |
| GET | `/api/admin/logs?level=` | admin |

Hubs:
- `/hubs/chat` — `SendMessage(receiverId, body, relatedListingId?)` · `MarkRead(messageId)`
- `/hubs/notifications` — receives `notify` events

---

## Production checklist (before going live)

- [ ] Rotate `Jwt:SigningKey` to a long secret stored outside source control
- [ ] Switch DB password & enable SSL on Postgres
- [ ] Set real SMTP credentials in `Email:*`
- [ ] Provide a real SMS provider in `Services/SmsService.cs` if you need SMS
- [ ] Add rate limiting (`builder.Services.AddRateLimiter(...)`)
- [ ] Add email confirmation flow (Identity supports it; we mark `EmailConfirmed=true` on register to keep dev simple)
- [ ] Replace permissive dev CORS origins with your production domain
- [ ] Front the API behind HTTPS reverse proxy
- [ ] Disable Swagger / OpenAPI in production
