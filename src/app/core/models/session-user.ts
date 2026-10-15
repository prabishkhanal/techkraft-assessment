import { Role } from './role';

/**
 * The currently logged-in user.
 * Kept in memory only (DECISIONS.md §1) — never persisted to storage.
 */
export interface SessionUser {
  /** Display username (e.g. "sales-user"). */
  username: string;
  /** The single role this user holds. */
  role: Role;
  /** Fabricated JWT access token attached by the HTTP interceptor. */
  accessToken: string;
  /** Fabricated JWT refresh token used by POST /auth/refresh. */
  refreshToken: string;
}
