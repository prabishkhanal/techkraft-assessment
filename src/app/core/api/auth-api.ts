import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { SessionUser } from '../models';

/** The demo login contract; session state stays in SessionService. */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);

  login(username: string) {
    return this.http.post<SessionUser>('/api/auth/login', { username });
  }
}
