# Samsary — 8-Week Build-From-Scratch Guide

A self-study roadmap to rebuild **Samsary** (a Sell/Rent listings platform) from zero.
Each week = study topics + daily tasks + files in *this repo* to read as your reference.

- **Backend:** ASP.NET Core 9, EF Core (PostgreSQL), Identity + JWT, SignalR, Serilog, Cloudinary, Clean Architecture + CQRS
- **Frontend:** Angular 21 (standalone, signals, zoneless), Bootstrap 5, SignalR client

> How to use: study the topics first, then do the daily tasks. Open the "Reference files" to see how the finished app does it. Try to write it yourself before peeking.

---

## Week 0 — Foundations (study BEFORE Angular & .NET)

Study these first; you don't write Samsary code yet.

| Topic | Why it matters here |
|------|---------------------|
| **C# fundamentals + OOP** (classes, interfaces, generics, async/await) | Whole backend |
| **HTTP & REST** (methods, status codes, JSON, headers) | API + Angular calls |
| **SQL & relational basics** (tables, keys, joins, indexes) | PostgreSQL schema |
| **Git** (commit, branch, merge) | Version control daily |
| **TypeScript** (types, interfaces, generics, async) | All Angular code |
| **HTML + CSS basics + Bootstrap grid** | UI layout |
| **JSON Web Tokens (JWT)** concept | Auth flow |
| **Clean Architecture + CQRS** concept | Backend layering |

Daily: Mon–Tue C#/OOP, Wed REST+JWT, Thu SQL, Fri TypeScript, weekend HTML/CSS/Bootstrap.

Reference: [README.md](README.md), [Samsary.sln](Samsary.sln)

---

## Week 1 — Backend skeleton, Domain & Database

**Study:** Clean Architecture layers, EF Core, Code-First migrations, PostgreSQL, dependency injection.

| Day | Task | Reference files |
|-----|------|-----------------|
| 1 | Create solution + 4 projects (Domain, Application, Infrastructure, Api). Set project references: Domain ← Application ← Infrastructure/Api. | [Samsary.sln](Samsary.sln), [src/Samsary.Domain/Samsary.Domain.csproj](src/Samsary.Domain/Samsary.Domain.csproj) |
| 2 | Build core entities (ApplicationUser, Listing, Category, ListingMedia). | src/Samsary.Domain/Entities/ |
| 3 | Add enums (ListingType, ListingStatus, MediaType). | src/Samsary.Domain/Enums/ |
| 4 | Set up `ApplicationDbContext`, connection string, first migration. | src/Samsary.Infrastructure/Persistence/ |
| 5 | Add repository interfaces + EF implementations (Unit of Work). | src/Samsary.Domain/Repositories/ |
| 6–7 | Run migration, seed Categories, confirm DB tables. | [src/Samsary.Api/appsettings.json](src/Samsary.Api/appsettings.json) |

**Goal:** API runs, database created, categories seeded.

---

## Week 2 — Auth (Identity + JWT) end-to-end

**Study:** ASP.NET Identity, JWT bearer, password hashing, CQRS dispatcher, FluentValidation, Angular standalone setup, services, HTTP interceptors.

| Day | Task | Reference files |
|-----|------|-----------------|
| 1 | Wire ASP.NET Identity + roles (User/Admin). | src/Samsary.Infrastructure/Identity/ |
| 2 | Build CQRS base (IRequest, ICommand, ISender, Dispatcher, ValidationBehavior). | src/Samsary.Application/Common/Messaging/ |
| 3 | Register + Login commands + validators. | src/Samsary.Application/Features/Auth/ |
| 4 | JWT token service + AuthController. | [src/Samsary.Api/Controllers/AuthController.cs](src/Samsary.Api/Controllers/AuthController.cs) |
| 5 | Create Angular app; auth.service + models. | [samsary-web/src/app/core/auth.service.ts](samsary-web/src/app/core/auth.service.ts), [samsary-web/src/app/core/models.ts](samsary-web/src/app/core/models.ts) |
| 6 | Login/Register pages + auth interceptor + guard. | samsary-web/src/app/features/auth/, [samsary-web/src/app/core/auth.interceptor.ts](samsary-web/src/app/core/auth.interceptor.ts), [samsary-web/src/app/core/auth.guard.ts](samsary-web/src/app/core/auth.guard.ts) |
| 7 | Log in seeded admin from the UI. | [samsary-web/src/app/app.routes.ts](samsary-web/src/app/app.routes.ts) |

**Goal:** Register, log in, store JWT, hit a protected endpoint.

---

## Week 3 — Listings CRUD + Categories + media

**Study:** EF relationships, specification pattern, file upload, Cloudinary, Angular forms + signals.

| Day | Task | Reference files |
|-----|------|-----------------|
| 1 | Categories list endpoint. | src/Samsary.Application/Features/Categories/ |
| 2 | Create/Update/Delete listing commands. | src/Samsary.Application/Features/Listings/ |
| 3 | Search + GetById + GetMine queries (specifications). | src/Samsary.Domain/Specifications/ |
| 4 | Cloudinary image/video upload, 5-min video reject. | src/Samsary.Infrastructure/Services/ |
| 5 | ListingsController. | [src/Samsary.Api/Controllers/ListingsController.cs](src/Samsary.Api/Controllers/ListingsController.cs) |
| 6 | Home + listing list/detail pages. | [samsary-web/src/app/features/home.ts](samsary-web/src/app/features/home.ts), samsary-web/src/app/features/listings/ |
| 7 | Create-listing form with image upload. | [samsary-web/src/app/core/api.service.ts](samsary-web/src/app/core/api.service.ts) |

**Goal:** Post a listing with photos; browse approved listings.

---

## Week 4 — Admin panel & moderation

**Study:** role-based auth, permission filters, dashboards.

| Day | Task | Reference files |
|-----|------|-----------------|
| 1 | Admin role + HasPermission filter. | [src/Samsary.Api/Filters/HasPermissionAttribute.cs](src/Samsary.Api/Filters/HasPermissionAttribute.cs) |
| 2 | Pending listings + Approve/Reject commands. | src/Samsary.Application/Features/Admin/ |
| 3 | Dashboard counters + users + block. | [src/Samsary.Api/Controllers/AdminController.cs](src/Samsary.Api/Controllers/AdminController.cs) |
| 4–5 | Admin UI (dashboard, pending, users). | samsary-web/src/app/features/admin/ |
| 6–7 | Approve a listing → it becomes public. | — |

**Goal:** Admin moderates listings; only approved ones are public.

---

## Week 5 — Real-time chat (SignalR)

**Study:** SignalR hubs/clients, JWT on WebSockets, RxJS.

| Day | Task | Reference files |
|-----|------|-----------------|
| 1 | ChatMessage entity + repo + endpoints. | [src/Samsary.Api/Controllers/ChatController.cs](src/Samsary.Api/Controllers/ChatController.cs) |
| 2 | ChatHub (SendMessage, MarkRead). | src/Samsary.Infrastructure/Hubs/ |
| 3 | Conversations + thread queries. | src/Samsary.Application/Features/Chat/ |
| 4–5 | Angular realtime.service + chat page. | [samsary-web/src/app/core/realtime.service.ts](samsary-web/src/app/core/realtime.service.ts), [samsary-web/src/app/features/chat.ts](samsary-web/src/app/features/chat.ts) |
| 6–7 | Two users chat live with read receipts. | — |

**Goal:** Live 1-to-1 chat with unread counts.

---

## Week 6 — Notifications (multi-channel)

**Study:** notification hub, SMTP email, SMS interface, trigger pattern.

| Day | Task | Reference files |
|-----|------|-----------------|
| 1 | Notification entity + types. | src/Samsary.Application/Features/Notifications/ |
| 2 | NotificationHub + INotificationService. | src/Samsary.Infrastructure/Hubs/, src/Samsary.Infrastructure/Services/ |
| 3 | Email (MailKit) + SMS stub. | [src/Samsary.Api/appsettings.json](src/Samsary.Api/appsettings.json) |
| 4–5 | Notifications page + bell. | [samsary-web/src/app/features/notifications.ts](samsary-web/src/app/features/notifications.ts) |
| 6–7 | New message/approve/reject → notify owner. | — |

**Goal:** Approve a listing → owner gets in-app + email notice.

---

## Week 7 — Profile, Reviews, Ads & extras

**Study:** profile updates, reviews, advertisements, consent, i18n.

| Day | Task | Reference files |
|-----|------|-----------------|
| 1 | Profile/avatar/change password. | [src/Samsary.Api/Controllers/UsersController.cs](src/Samsary.Api/Controllers/UsersController.cs), [samsary-web/src/app/features/profile.ts](samsary-web/src/app/features/profile.ts) |
| 2 | Reviews + Advertisements. | src/Samsary.Application/Features/Reviews/, Advertisements/ |
| 3 | Alerts + Consent. | src/Samsary.Application/Features/Alerts/, Consent/ |
| 4 | i18n (en/ar). | [samsary-web/src/app/core/i18n.service.ts](samsary-web/src/app/core/i18n.service.ts) |
| 5–7 | Theme, legal pages, polish. | [samsary-web/src/app/core/theme.service.ts](samsary-web/src/app/core/theme.service.ts) |

---

## Week 8 — Logging, errors, Docker & deploy

**Study:** Serilog/Seq, ProblemDetails, rate limiting, health checks, Docker Compose.

| Day | Task | Reference files |
|-----|------|-----------------|
| 1 | Serilog + request logging middleware. | [src/Samsary.Api/Middleware/RequestLoggingMiddleware.cs](src/Samsary.Api/Middleware/RequestLoggingMiddleware.cs) |
| 2 | Global exception handler. | [src/Samsary.Api/ExceptionHandling/GlobalExceptionHandler.cs](src/Samsary.Api/ExceptionHandling/GlobalExceptionHandler.cs) |
| 3 | Rate limiting, CORS, health, versioning. | [src/Samsary.Api/Program.cs](src/Samsary.Api/Program.cs) |
| 4 | Dockerize API + web. | [src/Samsary.Api/Dockerfile](src/Samsary.Api/Dockerfile), [samsary-web/Dockerfile](samsary-web/Dockerfile) |
| 5–7 | Run full stack via Compose; final review. | [docker-compose.yml](docker-compose.yml) |

**Goal:** Whole app runs with one `docker compose up`.

---

### Tips
- Always: study → build small slice → test → commit.
- Build one vertical feature fully (DB → API → UI) before the next.
- When stuck, open the matching reference file above and compare.
