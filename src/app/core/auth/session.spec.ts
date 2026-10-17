import { TestBed } from '@angular/core/testing';
import { SessionService } from './session';
import { Role, SessionUser } from '../models';

function fakeUser(role: Role = Role.Sales): SessionUser {
  return {
    username: `${role.toLowerCase()}-user`,
    role,
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
  };
}

describe('SessionService', () => {
  let session: SessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    session = TestBed.inject(SessionService);
  });

  it('starts with no user (logged out)', () => {
    expect(session.user()).toBeNull();
    expect(session.role()).toBeNull();
    expect(session.accessToken()).toBeNull();
    expect(session.username()).toBeNull();
  });

  it('login() sets the user and all computed signals', () => {
    const user = fakeUser(Role.Reviewer);
    session.login(user);

    expect(session.user()).toEqual(user);
    expect(session.role()).toBe(Role.Reviewer);
    expect(session.accessToken()).toBe('access-1');
    expect(session.username()).toBe('reviewer-user');
  });

  it('updateTokens() replaces both tokens without changing the role', () => {
    session.login(fakeUser(Role.Admin));
    session.updateTokens('access-2', 'refresh-2');

    expect(session.accessToken()).toBe('access-2');
    expect(session.user()!.refreshToken).toBe('refresh-2');
    expect(session.role()).toBe(Role.Admin);
  });

  it('updateTokens() is a no-op when logged out', () => {
    session.updateTokens('access-2', 'refresh-2');
    expect(session.user()).toBeNull();
  });

  it('updates expiry metadata and clears it when a legacy refresh omits it', () => {
    session.login(fakeUser());
    session.updateTokens('access-2', 'refresh-2', 123456789);
    expect(session.user()?.accessTokenExpiresAt).toBe(123456789);
    session.updateTokens('access-3', 'refresh-3');
    expect(session.user()?.accessTokenExpiresAt).toBeUndefined();
  });

  it('logout() clears everything back to null', () => {
    session.login(fakeUser());
    session.logout();

    expect(session.user()).toBeNull();
    expect(session.role()).toBeNull();
    expect(session.accessToken()).toBeNull();
  });
});
