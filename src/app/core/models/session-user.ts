import { Role } from './role';

/** Fixed demo identity with opaque, server-issued tokens. Stored in memory only. */
export interface SessionUser {
  username: string;
  role: Role;
  accessToken: string;
  refreshToken: string;
  /** Unix time in milliseconds; older demo sessions can use 401-based refresh. */
  accessTokenExpiresAt?: number;
}
