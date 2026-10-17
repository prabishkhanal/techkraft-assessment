import { Injectable, computed, signal } from '@angular/core';
import { SessionUser } from '../models/session-user';

/** In-memory session: reloading the page requires selecting a demo user again. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly user = signal<SessionUser | null>(null);
  readonly role = computed(() => this.user()?.role ?? null);
  readonly accessToken = computed(() => this.user()?.accessToken ?? null);
  readonly username = computed(() => this.user()?.username ?? null);

  login(user: SessionUser): void {
    this.user.set(user);
  }

  updateTokens(accessToken: string, refreshToken: string, accessTokenExpiresAt?: number): void {
    const current = this.user();
    if (current) this.user.set({ ...current, accessToken, refreshToken, accessTokenExpiresAt });
  }

  logout(): void {
    this.user.set(null);
  }
}
