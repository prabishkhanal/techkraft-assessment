import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, shareReplay, tap, throwError } from 'rxjs';
import { SessionService } from './session';
import { SessionUser } from '../models';

@Injectable({ providedIn: 'root' })
export class TokenRefresh {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private inFlight?: { refreshToken: string; stream: Observable<SessionUser> };

  refresh(): Observable<SessionUser> {
    const current = this.session.user();
    if (!current) return throwError(() => new Error('No session.'));
    if (this.inFlight?.refreshToken === current.refreshToken) return this.inFlight.stream;
    const stream = this.http
      .post<SessionUser>('/api/auth/refresh', { refreshToken: current.refreshToken })
      .pipe(
        tap((user) => {
          // A response from a previous login must never replace a newer session.
          if (this.session.user()?.refreshToken !== current.refreshToken)
            throw new Error('Session changed.');
          this.session.updateTokens(user.accessToken, user.refreshToken, user.accessTokenExpiresAt);
        }),
        catchError((error) => {
          if (this.session.user()?.refreshToken === current.refreshToken) {
            this.session.logout();
            void this.router.navigate(['/login']);
          }
          return throwError(() => error);
        }),
        finalize(() => {
          if (this.inFlight?.stream === stream) this.inFlight = undefined;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    this.inFlight = { refreshToken: current.refreshToken, stream };
    return stream;
  }
}
