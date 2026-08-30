import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard, adminGuard, staffGuard, guestGuard, permissionGuard, firstPermittedRoute } from './core/auth.guard';
import { AuthService } from './core/auth.service';
import { ModeratorPermission } from './core/models';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home').then(m => m.HomeComponent) },
  { path: 'listings', loadComponent: () => import('./features/listings/listings').then(m => m.ListingsComponent) },
  { path: 'listings/new', canActivate: [authGuard], loadComponent: () => import('./features/listings/listing-form').then(m => m.ListingFormComponent) },
  { path: 'listings/:id/edit', canActivate: [authGuard], loadComponent: () => import('./features/listings/listing-form').then(m => m.ListingFormComponent) },
  { path: 'listings/:id', loadComponent: () => import('./features/listings/listing-detail').then(m => m.ListingDetailComponent) },

  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/login').then(m => m.LoginComponent) },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./features/auth/register').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password').then(m => m.ResetPasswordComponent) },
  { path: 'confirm-email', loadComponent: () => import('./features/auth/confirm-email').then(m => m.ConfirmEmailComponent) },

  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./features/profile').then(m => m.ProfileComponent) },
  { path: 'users/:id', loadComponent: () => import('./features/user-profile').then(m => m.UserProfileComponent) },
  { path: 'my-listings', canActivate: [authGuard], loadComponent: () => import('./features/listings/listings').then(m => m.ListingsComponent), data: { mine: true } },
  { path: 'notifications', canActivate: [authGuard], loadComponent: () => import('./features/notifications').then(m => m.NotificationsComponent) },
  { path: 'chat', canActivate: [authGuard], loadComponent: () => import('./features/chat').then(m => m.ChatComponent) },
  { path: 'chat/:userId', canActivate: [authGuard], loadComponent: () => import('./features/chat').then(m => m.ChatComponent) },

  {
    path: 'admin', canActivate: [staffGuard],
    loadComponent: () => import('./features/admin/admin-shell').then(m => m.AdminShellComponent),
    children: [
      {
        // Smart landing: Admin → dashboard, Moderator → first permitted section.
        path: '', pathMatch: 'full',
        redirectTo: () => firstPermittedRoute(inject(AuthService)).join('/').replace(/^\//, '')
      },
      { path: 'dashboard',  canActivate: [adminGuard],                                          loadComponent: () => import('./features/admin/dashboard').then(m => m.AdminDashboardComponent) },
      { path: 'moderate',   canActivate: [permissionGuard(ModeratorPermission.ManageListings)], loadComponent: () => import('./features/admin/moderate').then(m => m.AdminModerateComponent) },
      { path: 'users',      canActivate: [permissionGuard(ModeratorPermission.ManageUsers)],    loadComponent: () => import('./features/admin/users').then(m => m.AdminUsersComponent) },
      { path: 'ads',        canActivate: [permissionGuard(ModeratorPermission.ManageAds)],      loadComponent: () => import('./features/admin/advertisements').then(m => m.AdminAdsComponent) },
      { path: 'reviews',    canActivate: [permissionGuard(ModeratorPermission.ManageReviews)],  loadComponent: () => import('./features/admin/reviews').then(m => m.AdminReviewsComponent) },
      { path: 'logs',       canActivate: [permissionGuard(ModeratorPermission.ViewLogs)],       loadComponent: () => import('./features/admin/logs').then(m => m.AdminLogsComponent) },
      { path: 'moderators', canActivate: [adminGuard], loadComponent: () => import('./features/admin/moderators').then(m => m.AdminModeratorsComponent) },
      { path: 'theme',      canActivate: [adminGuard], loadComponent: () => import('./features/admin/theme').then(m => m.AdminThemeComponent) },
      { path: 'categories',  canActivate: [adminGuard], loadComponent: () => import('./features/admin/categories').then(m => m.AdminCategoriesComponent) }
    ]
  },

  { path: 'terms', loadComponent: () => import('./features/legal').then(m => m.LegalComponent), data: { page: 'terms' } },
  { path: 'privacy', loadComponent: () => import('./features/legal').then(m => m.LegalComponent), data: { page: 'privacy' } },
  { path: 'cookies', loadComponent: () => import('./features/legal').then(m => m.LegalComponent), data: { page: 'cookies' } },

  { path: '**', redirectTo: '' }
];
