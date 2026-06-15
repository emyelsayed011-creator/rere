import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home').then(m => m.HomeComponent) },
  { path: 'listings', loadComponent: () => import('./features/listings/listings').then(m => m.ListingsComponent) },
  { path: 'listings/new', canActivate: [authGuard], loadComponent: () => import('./features/listings/listing-form').then(m => m.ListingFormComponent) },
  { path: 'listings/:id/edit', canActivate: [authGuard], loadComponent: () => import('./features/listings/listing-form').then(m => m.ListingFormComponent) },
  { path: 'listings/:id', loadComponent: () => import('./features/listings/listing-detail').then(m => m.ListingDetailComponent) },

  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/login').then(m => m.LoginComponent) },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./features/auth/register').then(m => m.RegisterComponent) },

  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./features/profile').then(m => m.ProfileComponent) },
  { path: 'my-listings', canActivate: [authGuard], loadComponent: () => import('./features/listings/listings').then(m => m.ListingsComponent), data: { mine: true } },
  { path: 'notifications', canActivate: [authGuard], loadComponent: () => import('./features/notifications').then(m => m.NotificationsComponent) },
  { path: 'chat', canActivate: [authGuard], loadComponent: () => import('./features/chat').then(m => m.ChatComponent) },
  { path: 'chat/:userId', canActivate: [authGuard], loadComponent: () => import('./features/chat').then(m => m.ChatComponent) },

  {
    path: 'admin', canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-shell').then(m => m.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard').then(m => m.AdminDashboardComponent) },
      { path: 'moderate', loadComponent: () => import('./features/admin/moderate').then(m => m.AdminModerateComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/users').then(m => m.AdminUsersComponent) },
      { path: 'logs', loadComponent: () => import('./features/admin/logs').then(m => m.AdminLogsComponent) }
    ]
  },

  { path: '**', redirectTo: '' }
];
