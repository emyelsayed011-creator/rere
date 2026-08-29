import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { AuthModalService } from './auth-modal.service';
import { ModeratorPermission } from './models';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const modal = inject(AuthModalService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  modal.open('login');
  return router.createUrlTree(['/']);
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const modal = inject(AuthModalService);
  if (auth.isAdmin()) return true;
  if (auth.isAuthenticated()) return router.createUrlTree(['/']);
  modal.open('login');
  return router.createUrlTree(['/']);
};

export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const modal = inject(AuthModalService);
  if (auth.isStaff()) return true;
  if (auth.isAuthenticated()) return router.createUrlTree(['/']);
  modal.open('login');
  return router.createUrlTree(['/']);
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
