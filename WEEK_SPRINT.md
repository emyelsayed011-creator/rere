# Samsary - Sprint عملي 7 أيام (مبسّط + بالكود)

الهدف من الملف ده: تفهم المشروع الكبير بسرعة، وتشتغل يوم بيوم بشكل واضح.
كل يوم فيه:
- هتعمل ايه
- مكانه في السيستم
- كود بداية (Starter Snippet)
- ازاي تتأكد إنك خلصت اليوم

---

## اليوم 1 - الأساسيات وقاعدة البيانات (أهم يوم)

### 1) Backend - افهم الدومين الأول
المكان:
- src/Samsary.Domain/Entities/Listing.cs
- src/Samsary.Domain/Entities/Category.cs
- src/Samsary.Domain/Entities/ApplicationUser.cs

ليه؟
- كل السيستم مبني على الكيانات دي: مستخدم، إعلان، فئة.

كود مهم تركز عليه:

```csharp
public class Listing
{
	public int Id { get; set; }
	public string Title { get; set; } = string.Empty;
	public decimal Price { get; set; }
	public ListingType Type { get; set; }
	public ListingStatus Status { get; set; } = ListingStatus.Pending;

	public int CategoryId { get; set; }
	public Category? Category { get; set; }

	public string OwnerId { get; set; } = string.Empty;
	public ApplicationUser? Owner { get; set; }
}
```

شرح سريع:
- CategoryId + Category = علاقة Many-to-One مع التصنيفات.
- OwnerId + Owner = صاحب الإعلان.
- Status يبدأ Pending عشان الـ Admin يراجع.

---

### 2) Backend - افهم رسم العلاقات في EF Core
المكان:
- src/Samsary.Infrastructure/Persistence/ApplicationDbContext.cs

كود مهم تركز عليه:

```csharp
b.Entity<Listing>(e =>
{
	e.HasOne(x => x.Owner).WithMany(u => u.Listings)
		.HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Cascade);

	e.HasOne(x => x.Category).WithMany(c => c.Listings)
		.HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);

	e.Property(x => x.Price).HasPrecision(18, 2);
	e.HasIndex(x => x.Status);
	e.HasIndex(x => x.Type);
});
```

شرح سريع:
- Cascade مع Owner: حذف المستخدم يحذف إعلاناته.
- Restrict مع Category: مينفعش تحذف فئة وفيها إعلانات.
- Index على Status/Type لتسريع البحث.

---

### 3) Backend - افهم المايجريشنز بدل ما تبدأ من الصفر
المكان:
- src/Samsary.Infrastructure/Persistence/Migrations/

أوامر اليوم 1:

```powershell
dotnet restore
dotnet build
dotnet test
```

لو محتاج تشوف أو تنشئ Migration (تعليمي):

```powershell
dotnet ef migrations list --project src/Samsary.Infrastructure --startup-project src/Samsary.Api
dotnet ef database update --project src/Samsary.Infrastructure --startup-project src/Samsary.Api
```

---

### 4) Frontend - افهم شكل البيانات اللي جاية من API
المكان:
- samsary-web/src/app/core/models.ts

كود مهم تركز عليه:

```ts
export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  type: ListingType;
  status: ListingStatus;
  category: Category;
  ownerId: string;
  ownerDisplayName: string;
  createdAt: string;
}
```

شرح سريع:
- ده العقد (Contract) بين الـ API والـ UI.
- لو غيرت DTO في الباك لازم تراجع الموديل هنا.

---

### 5) Frontend - افهم الـ Routing الأساسي
المكان:
- samsary-web/src/app/app.routes.ts

كود مهم تركز عليه:

```ts
export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home').then(m => m.HomeComponent) },
  { path: 'listings', loadComponent: () => import('./features/listings/listings').then(m => m.ListingsComponent) },
  { path: 'listings/new', canActivate: [authGuard], loadComponent: () => import('./features/listings/listing-form').then(m => m.ListingFormComponent) },
  { path: '**', redirectTo: '' }
];
```

شرح سريع:
- الصفحة الرئيسية + صفحة الإعلانات متاحة للجميع.
- إنشاء إعلان محمي بـ authGuard.

---

### 6) Frontend - افهم Bootstrap للتطبيق
المكان:
- samsary-web/src/main.ts
- samsary-web/src/app/app.config.ts

كود مهم تركز عليه:

```ts
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
```

```ts
providers: [
  provideZonelessChangeDetection(),
  provideRouter(routes, withComponentInputBinding()),
  provideHttpClient(withInterceptors([authInterceptor]))
]
```

شرح سريع:
- التطبيق Standalone بالكامل.
- HTTP Interceptor بيتحكم في JWT بعدين في يوم 2.

---

### 7) Test Checklist - نهاية اليوم 1

Backend:
- المشروع بيعمل Build بدون Errors.
- قاعدة البيانات اتعملها Update بنجاح.

Frontend:
- npm install اشتغلت.
- npm start فتح التطبيق على localhost:4200.

أوامر التحقق:

```powershell
dotnet build Samsary.sln
dotnet test
cd samsary-web
npm install
npm start
```

---

## اليوم 2 - Auth (تسجيل + دخول + JWT)

المكان:
- src/Samsary.Api/Controllers/AuthController.cs
- src/Samsary.Application/Features/Auth/
- samsary-web/src/app/core/auth.service.ts
- samsary-web/src/app/core/auth.interceptor.ts
- samsary-web/src/app/core/auth.guard.ts

Starter Snippet:

```csharp
[HttpPost("login")]
public async Task<IActionResult> Login(LoginRequest request)
{
	var result = await _sender.Send(new LoginCommand(request.Email, request.Password));
	return Ok(result);
}
```

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
```

---

## اليوم 3 - Listings CRUD + Media

المكان:
- src/Samsary.Api/Controllers/ListingsController.cs
- src/Samsary.Application/Features/Listings/
- samsary-web/src/app/features/listings/

Starter Snippet:

```csharp
[Authorize]
[HttpPost]
public async Task<IActionResult> Create(CreateListingRequest request)
{
	var id = await _sender.Send(new CreateListingCommand(
		request.Title, request.Description, request.Price, request.Currency,
		request.Type, request.CategoryId, request.Location));
	return Ok(new { id });
}
```

---

## اليوم 4 - Admin Moderation

المكان:
- src/Samsary.Api/Controllers/AdminController.cs
- src/Samsary.Api/Filters/HasPermissionAttribute.cs
- samsary-web/src/app/features/admin/

Starter Snippet:

```csharp
[HttpPost("listings/{id:int}/approve")]
public async Task<IActionResult> Approve(int id)
{
	await _sender.Send(new ApproveListingCommand(id));
	return NoContent();
}
```

---

## اليوم 5 - Chat + Notifications Realtime

المكان:
- src/Samsary.Infrastructure/Hubs/ChatHub.cs
- src/Samsary.Infrastructure/Hubs/NotificationHub.cs
- samsary-web/src/app/core/realtime.service.ts
- samsary-web/src/app/features/chat.ts

Starter Snippet:

```csharp
public async Task SendMessage(string receiverId, string body, int? relatedListingId = null)
{
	// save message + trigger notification
	await Clients.User(receiverId).SendAsync("receiveMessage", body);
}
```

---

## اليوم 6 - Profile + Reviews + Ads + i18n

المكان:
- src/Samsary.Api/Controllers/UsersController.cs
- src/Samsary.Application/Features/Reviews/
- src/Samsary.Api/Controllers/AdvertisementsController.cs
- samsary-web/src/app/features/profile.ts

Starter Snippet:

```csharp
[Authorize]
[HttpPut("me")]
public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request)
{
	await _sender.Send(new UpdateProfileCommand(request.DisplayName, request.Bio));
	return NoContent();
}
```

---

## اليوم 7 - Hardening + Docker + Full Test

المكان:
- src/Samsary.Api/Program.cs
- src/Samsary.Api/ExceptionHandling/GlobalExceptionHandler.cs
- docker-compose.yml
- samsary-web/Dockerfile

Starter Snippet:

```csharp
builder.Services.AddRateLimiter(options =>
{
	options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});
```

أوامر النهاية:

```powershell
dotnet test
cd samsary-web
npm test
cd ..
docker compose up --build
```

---

## مسار Frontend فقط (يوم بيوم)

الجزء ده مخصوص للفرونت فقط، عشان تمشي عليه من غير تشتيت.

### اليوم 1 - Setup + Routing + Models
تاسكات:
1. راجع `app.config.ts` وافهم providers (router/http/interceptor).
2. راجع `app.routes.ts` ومسارات الصفحات الأساسية.
3. راجع `core/models.ts` وتأكد إن Interfaces مطابقة للـ API.

أماكن الشغل:
- samsary-web/src/app/app.config.ts
- samsary-web/src/app/app.routes.ts
- samsary-web/src/app/core/models.ts

تسليم اليوم:
- التطبيق يشتغل على `http://localhost:4200`.
- التنقل بين Home و Listings شغال بدون أخطاء Console.

### اليوم 2 - Auth UI + Guard + Interceptor
تاسكات:
1. شاشة Login وشاشة Register.
2. تخزين `token` بعد تسجيل الدخول.
3. تفعيل `authInterceptor` لإرسال Authorization header.
4. تفعيل `authGuard` لحماية الصفحات الخاصة.

أماكن الشغل:
- samsary-web/src/app/features/auth/login.ts
- samsary-web/src/app/features/auth/register.ts
- samsary-web/src/app/core/auth.service.ts
- samsary-web/src/app/core/auth.interceptor.ts
- samsary-web/src/app/core/auth.guard.ts

تسليم اليوم:
- المستخدم يقدر يعمل login.
- فتح `listings/new` بدون login يوديه على صفحة الدخول.

### اليوم 3 - Listings Screens (List/Detail/Form)
تاسكات:
1. صفحة عرض الإعلانات `listings`.
2. صفحة التفاصيل `listings/:id`.
3. صفحة إنشاء/تعديل إعلان `listings/new` و `listings/:id/edit`.
4. ربط الصور والفيديو داخل الفورم.

أماكن الشغل:
- samsary-web/src/app/features/listings/listings.ts
- samsary-web/src/app/features/listings/listing-detail.ts
- samsary-web/src/app/features/listings/listing-form.ts
- samsary-web/src/app/core/api.service.ts

تسليم اليوم:
- إنشاء إعلان جديد من الواجهة بنجاح.
- عرض الإعلان مباشرة في list/detail.

### اليوم 4 - Admin Frontend
تاسكات:
1. `admin-shell` مع children routes.
2. Dashboard أرقام عامة.
3. شاشة Moderate لاعتماد/رفض الإعلانات.
4. شاشة Users للحظر وفك الحظر.

أماكن الشغل:
- samsary-web/src/app/features/admin/admin-shell.ts
- samsary-web/src/app/features/admin/dashboard.ts
- samsary-web/src/app/features/admin/moderate.ts
- samsary-web/src/app/features/admin/users.ts

تسليم اليوم:
- حساب Admin يشوف صفحات `/admin/*`.
- حساب User عادي يتمنع من صفحات الأدمن.

### اليوم 5 - Chat + Notifications UI
تاسكات:
1. ربط SignalR في `realtime.service.ts`.
2. شاشة محادثات + Thread الرسائل.
3. شاشة Notifications + unread badge.

أماكن الشغل:
- samsary-web/src/app/core/realtime.service.ts
- samsary-web/src/app/features/chat.ts
- samsary-web/src/app/features/notifications.ts
- samsary-web/src/app/shared/navbar.ts

تسليم اليوم:
- رسائل لحظية بين حسابين من غير refresh.
- إشعار جديد يظهر مباشرة في الـ bell.

### اليوم 6 - Profile + UX Extras
تاسكات:
1. صفحة Profile (بيانات + صورة + تغيير كلمة المرور).
2. مراجعة i18n service (en/ar).
3. مراجعة theme service إن وجد (تناسق الثيم).

أماكن الشغل:
- samsary-web/src/app/features/profile.ts
- samsary-web/src/app/core/i18n.service.ts
- samsary-web/src/app/core/theme.service.ts

تسليم اليوم:
- تحديث البيانات الشخصية ينعكس في الواجهة.
- تغيير اللغة يؤثر على النصوص الأساسية.

### اليوم 7 - Frontend Production Readiness
تاسكات:
1. تشغيل `npm test` وحل أي unit test failures.
2. Build production (`npm run build`).
3. مراجعة `Dockerfile` و `nginx.conf` لتقديم ملفات SPA وربط `/api` و `/hubs`.

أماكن الشغل:
- samsary-web/Dockerfile
- samsary-web/nginx.conf
- samsary-web/angular.json

تسليم اليوم:
- Build production ناجح.
- الويب يفتح من Docker بدون مشاكل Routing.

---

## قاعدة الشغل اليومية

كل يوم اشتغل بنفس الترتيب:
1. افهم الملفات المذكورة.
2. اكتب كود بسيط شغال.
3. اختبره.
4. بعد كده وسّع الميزة.

لو عايز، الخطوة الجاية أديك "اليوم 2" بنفس مستوى التفصيل اللي فوق (Task-by-task + Endpoints + Angular screens + Checklist اختبار).
