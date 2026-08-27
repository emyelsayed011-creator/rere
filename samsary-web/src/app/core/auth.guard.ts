import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { ModeratorPermission } from './models';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  router.navigateByUrl('/login');
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAdmin()) return true;
  router.navigateByUrl(auth.isAuthenticated() ? '/' : '/login');
  return false;
};

/** Passes for both Admin and Moderator users. */
export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isStaff()) return true;
  router.navigateByUrl(auth.isAuthenticated() ? '/' : '/login');
  return false;
};

/**
 * Route guard factory — requires the caller to have a specific moderator permission.
 * Admin users always pass. Blocked users are redirected to the first section
 * they *can* access, or to home if they have no admin permissions.
 */
export const permissionGuard = (perm: ModeratorPermission): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasPermission(perm)) return true;
  // Redirect to the first section this user IS permitted to see.
  return router.createUrlTree(firstPermittedRoute(auth));
};

/** Returns the router path segments for the first admin section the user can access. */
export function firstPermittedRoute(auth: AuthService): string[] {
  const P = ModeratorPermission;
  if (auth.isAdmin())                        return ['/admin/dashboard'];
  if (auth.hasPermission(P.ManageListings)) return ['/admin/moderate'];
  if (auth.hasPermission(P.ManageUsers))    return ['/admin/users'];
  if (auth.hasPermission(P.ManageReviews))  return ['/admin/reviews'];
  if (auth.hasPermission(P.ManageAds))      return ['/admin/ads'];
  if (auth.hasPermission(P.ViewLogs))       return ['/admin/logs'];
  return ['/'];
}

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return true;
  router.navigateByUrl('/');
  return false;
};
