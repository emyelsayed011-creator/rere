import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  let authed = req;
  if (token) {
    // Never force Content-Type for FormData — browser must set multipart boundary automatically
    const isFormData = req.body instanceof FormData;
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    authed = req.clone({ setHeaders: headers, withCredentials: true });
  }

  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      if (auth.isAuthenticated()) {
        if (err.status === 401) {
          auth.logout();
          router.navigateByUrl('/login');
        } else if (err.status === 403 && err.error?.code === 'User.Banned') {
          // Account was suspended — force logout and redirect with message
          auth.logout();
          router.navigateByUrl('/login?banned=1');
        }
      }
      return throwError(() => err);
    })
  );
};
