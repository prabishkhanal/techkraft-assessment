import { Injectable, computed, signal } from '@angular/core';
import { Role } from '../models/role';
import { SessionUser } from '../models/session-user';

/**
 * Session service — the single source of truth for the current user.
 *
 * Tokens and role are kept in a signal (memory only, DECISIONS.md §1).
 * Page reload clears the session; the user must log in again.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {

  /** The current user, or null when logged out. */
  readonly user = signal<SessionUser | null>(null);

  /** Convenience: current role (null when logged out). */
  readonly role = computed<Role | null>(() => this.user()?.role ?? null);

  /** Convenience: the access token the interceptor needs (null when logged out). */
  readonly accessToken = computed<string | null>(() => this.user()?.accessToken ?? null);

  /** Convenience: the username for ownership checks (null when logged out). */
  readonly username = computed<string | null>(() => this.user()?.username ?? null);

  /** Called by the login screen to set the fabricated session. */
  login(user: SessionUser): void {
    this.user.set(user);
  }

  /** Replace both tokens after a successful POST /auth/refresh. */
  updateTokens(accessToken: string, refreshToken: string): void {
    const current = this.user();
    if (current) {
      this.user.set({ ...current, accessToken, refreshToken });
    }
  }

  /**
   * Clear the session entirely.
   * Called on refresh failure (DECISIONS.md §7) or manual logout.
   */
  logout(): void {
    this.user.set(null);
  }
}
