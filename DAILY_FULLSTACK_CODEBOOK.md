# Samsary - Daily Fullstack Codebook (7 Days)

الملف ده معمول عشان يبقى مرجع يومي واضح.
كل يوم فيه:
- Topic المذاكرة
- Backend Tasks + Starter Code
- Frontend Tasks + Starter Code
- Definition of Done

---

## Day 1 - Foundations + DB + App Shell

### Topic المذاكرة
- Clean Architecture basics
- EF Core relationships + migrations
- Angular standalone bootstrap + routing

### Backend Tasks
1. راجع الكيانات الأساسية: Listing, Category, ApplicationUser.
2. افهم العلاقات والـ indexes في ApplicationDbContext.
3. شغل migrations وتأكد إن قاعدة البيانات جاهزة.

Starter Code (Backend):

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

### Frontend Tasks
1. راجع models interfaces اللي جاية من API.
2. راجع routes الأساسية.
3. راجع bootstrap و app providers.

Starter Code (Frontend):

```ts
export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home').then(m => m.HomeComponent) },
  { path: 'listings', loadComponent: () => import('./features/listings/listings').then(m => m.ListingsComponent) },
  { path: '**', redirectTo: '' }
];
```

Definition of Done:
- Backend build شغال.
- Frontend يفتح على localhost:4200.

---

## Day 2 - Auth End-to-End

### Topic المذاكرة
- ASP.NET Identity + JWT
- Angular interceptors + route guards

### Backend Tasks
1. Register/Login commands + validation.
2. AuthController endpoints.
3. JWT generation and return AuthResponse.

Starter Code (Backend):

```csharp
[HttpPost("login")]
public async Task<IActionResult> Login(LoginRequest request)
{
    var result = await _sender.Send(new LoginCommand(request.Email, request.Password));
    return Ok(result);
}
```

### Frontend Tasks
1. Login/Register screens.
2. حفظ token بعد login.
3. authInterceptor يضيف Authorization header.
4. authGuard يحمي الصفحات الخاصة.

Starter Code (Frontend):

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
```

Definition of Done:
- Login/Register ناجحين.
- أي route محمي يطلب تسجيل الدخول.

---

## Day 3 - Listings CRUD + Media

### Topic المذاكرة
- CQRS handlers
- EF query/filtering
- Angular forms

### Backend Tasks
1. Create/Update/Delete listing commands.
2. Search/GetById/GetMine queries.
3. Image/video upload endpoint wiring.

Starter Code (Backend):

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

### Frontend Tasks
1. listings page (search/filter/paging).
2. listing detail page.
3. listing form (create/edit + upload media).

Starter Code (Frontend):

```ts
submit() {
  if (this.form.invalid) return;
  this.api.createListing(this.form.value).subscribe({
    next: (res) => this.router.navigate(['/listings', res.id])
  });
}
```

Definition of Done:
- إنشاء إعلان جديد وعرضه في list/detail.

---

## Day 4 - Admin Moderation

### Topic المذاكرة
- Role/Permission based authorization
- Admin UX flow

### Backend Tasks
1. Pending listings endpoint.
2. Approve/Reject commands.
3. Users block/unblock endpoints.

Starter Code (Backend):

```csharp
[HttpPost("listings/{id:int}/approve")]
public async Task<IActionResult> Approve(int id)
{
    await _sender.Send(new ApproveListingCommand(id));
    return NoContent();
}
```

### Frontend Tasks
1. Admin shell + nested routes.
2. Dashboard counters.
3. Moderate screen approve/reject.
4. Users screen block/unblock.

Starter Code (Frontend):

```ts
approve(id: number) {
  this.api.approveListing(id).subscribe(() => this.loadPending());
}
```

Definition of Done:
- Admin يقدر يوافق/يرفض إعلان من الواجهة.

---

## Day 5 - Realtime Chat + Notifications

### Topic المذاكرة
- SignalR hubs + client connections
- Realtime state updates in Angular

### Backend Tasks
1. ChatHub send/receive/read.
2. Notification trigger after new message.
3. Notifications query/read endpoints.

Starter Code (Backend):

```csharp
public async Task SendMessage(string receiverId, string body, int? relatedListingId = null)
{
    // save message + trigger notifications
    await Clients.User(receiverId).SendAsync("receiveMessage", body);
}
```

### Frontend Tasks
1. realtime.service SignalR connection.
2. chat screen thread updates instantly.
3. notifications bell + notifications page.

Starter Code (Frontend):

```ts
this.hubConnection.on('receiveMessage', (msg) => {
  this.messages.update(items => [...items, msg]);
});
```

Definition of Done:
- رسائل لحظية بين حسابين بدون refresh.

---

## Day 6 - Profile + Reviews + Ads + i18n

### Topic المذاكرة
- Profile management patterns
- Review moderation flow
- Basic localization strategy

### Backend Tasks
1. UsersController profile update/avatar/password.
2. Reviews endpoints.
3. Advertisements endpoints.

Starter Code (Backend):

```csharp
[Authorize]
[HttpPut("me")]
public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request)
{
    await _sender.Send(new UpdateProfileCommand(request.DisplayName, request.Bio));
    return NoContent();
}
```

### Frontend Tasks
1. Profile page form + save.
2. Reviews UI integration.
3. Ads placements integration.
4. i18n language switch.

Starter Code (Frontend):

```ts
setLanguage(lang: 'en' | 'ar') {
  this.i18n.setLanguage(lang);
}
```

Definition of Done:
- Profile update شغال + اللغة بتتغير.

---

## Day 7 - Hardening + Docker + Final Validation

### Topic المذاكرة
- Global error handling
- Rate limiting + health checks
- Dockerized fullstack deployment

### Backend Tasks
1. راجع Program.cs (rate limiting, cors, hubs, health).
2. راجع GlobalExceptionHandler.
3. شغل integration flow من أول auth لحد chat.

Starter Code (Backend):

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});
```

### Frontend Tasks
1. npm test + حل failures.
2. npm run build production.
3. مراجعة nginx.conf routes fallback + API proxy.

Starter Code (Frontend):

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Definition of Done:
- Full stack شغال بـ docker compose.
- كل flows الأساسية تمشي بدون errors حرجة.

---

## Daily Commands

```powershell
dotnet restore
dotnet build
dotnet test

cd samsary-web
npm install
npm test
npm run build
cd ..

docker compose up --build
```

## Reference Files Map

- Backend entry: src/Samsary.Api/Program.cs
- DbContext: src/Samsary.Infrastructure/Persistence/ApplicationDbContext.cs
- Auth API: src/Samsary.Api/Controllers/AuthController.cs
- Listings API: src/Samsary.Api/Controllers/ListingsController.cs
- Admin API: src/Samsary.Api/Controllers/AdminController.cs
- Frontend routes: samsary-web/src/app/app.routes.ts
- Frontend models: samsary-web/src/app/core/models.ts
- Frontend realtime: samsary-web/src/app/core/realtime.service.ts
