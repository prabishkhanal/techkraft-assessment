import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { SessionService } from '../auth/session';
import { TokenRefresh } from '../auth/token-refresh';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/') || req.url.startsWith('/api/auth/')) return next(req);
  const session = inject(SessionService);
  const refresh = inject(TokenRefresh);
  const sentUser = session.user();
  const token = sentUser?.accessToken;
  // Refresh on demand before expiry, rather than sending a known-expired token.
  // A small margin covers time spent sending the request. No background timer is needed.
  if (
    token &&
    sentUser.accessTokenExpiresAt != null &&
    sentUser.accessTokenExpiresAt <= Date.now() + 5000
  ) {
    return refresh
      .refresh()
      .pipe(
        switchMap((user) =>
          next(req.clone({ setHeaders: { Authorization: `Bearer ${user.accessToken}` } })),
        ),
      );
    // Send once after proactive refresh; a 401 here must not start another refresh.
  }
  const authenticated = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
  return next(authenticated).pipe(
    catchError((error) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        !token ||
        session.username() !== sentUser?.username
      ) {
        return throwError(() => error);
      }
      // Another request may already have refreshed while this older 401 was in transit.
      const latest = session.accessToken();
      if (latest && latest !== token)
        return next(req.clone({ setHeaders: { Authorization: `Bearer ${latest}` } }));
      return refresh
        .refresh()
        .pipe(
          switchMap((user) =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${user.accessToken}` } })),
          ),
        );
      // Retrying via next bypasses this interceptor, so a second 401 cannot loop.
    }),
  );
};
