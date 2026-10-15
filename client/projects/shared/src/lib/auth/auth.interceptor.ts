import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { GURTUNDAA_API_URL } from '../api/api-config';
import { AuthService } from './auth.service';

/** Adds the bearer token to API calls and retries once with a refreshed token on 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const apiUrl = inject(GURTUNDAA_API_URL);

  const isApiCall = req.url.startsWith(apiUrl);
  const isAuthCall = req.url.startsWith(`${apiUrl}/auth/`) && !req.url.endsWith('/auth/me');
  if (!isApiCall || isAuthCall) {
    return next(req);
  }

  return next(withToken(req, auth.accessToken)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        switchMap((token) => {
          if (!token) {
            void router.navigateByUrl('/login');
            return throwError(() => error);
          }
          return next(withToken(req, token));
        }),
      );
    }),
  );
};

function withToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}
