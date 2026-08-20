import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthResponse } from './models';
import { AuthService } from './auth.service';

/** Refresh compartilhado para não disparar vários /auth/refresh em paralelo. */
let refreshInFlight: Observable<AuthResponse> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isAuthCall = req.url.includes('/api/auth/');
  const authedReq = isAuthCall ? req : withBearer(req, auth.accessToken);

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const canRetry = err.status === 401 && !isAuthCall && !!auth.refreshTokenValue;
      if (!canRetry) return throwError(() => err);

      refreshInFlight ??= auth.refresh().pipe(
        finalize(() => (refreshInFlight = null)),
        shareReplay(1),
      );

      return refreshInFlight.pipe(
        switchMap(() => next(withBearer(req, auth.accessToken))),
        catchError(refreshErr => {
          auth.logout();
          router.navigateByUrl('/entrar');
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};

function withBearer(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}
