import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TokenRefresh } from './token-refresh';
import { SessionService } from './session';
import { Role } from '../models';
import { testUser } from '../../testing/fixtures';

describe('TokenRefresh', () => {
  let refresh: TokenRefresh;
  let session: SessionService;
  let backend: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    refresh = TestBed.inject(TokenRefresh);
    session = TestBed.inject(SessionService);
    backend = TestBed.inject(HttpTestingController);
    session.login(testUser());
  });
  afterEach(() => backend.verify());

  it('does not overwrite or log out a newer login when an old refresh completes', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const error = vi.fn();
    refresh.refresh().subscribe({ error });
    const request = backend.expectOne('/api/auth/refresh');
    const newer = { ...testUser(Role.Admin), refreshToken: 'admin-refresh' };
    session.login(newer);
    request.flush({ ...testUser(), accessToken: 'old-refreshed', refreshToken: 'old-refresh' });
    expect(error).toHaveBeenCalledOnce();
    expect(session.user()).toEqual(newer);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('releases waiters and clears the session on a network failure', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const error = vi.fn();
    refresh.refresh().subscribe({ error });
    refresh.refresh().subscribe({ error });
    backend.expectOne('/api/auth/refresh').error(new ProgressEvent('error'));
    expect(error).toHaveBeenCalledTimes(2);
    expect(session.user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('isolates an in-flight refresh from a newer login and keeps the newer refresh shared', () => {
    const oldError = vi.fn();
    refresh.refresh().subscribe({ error: oldError });
    const old = backend.expectOne('/api/auth/refresh');
    session.login({ ...testUser(Role.Admin), refreshToken: 'admin-refresh' });
    const result = vi.fn();
    refresh.refresh().subscribe(result);
    const current = backend.expectOne('/api/auth/refresh');
    expect(current.request.body.refreshToken).toBe('admin-refresh');
    old.flush({ ...testUser(), accessToken: 'old-access', refreshToken: 'old-rotated' });
    expect(oldError).toHaveBeenCalledOnce();
    // Completing the old stream must not clear the new session's coordinator.
    refresh.refresh().subscribe(result);
    backend.expectNone('/api/auth/refresh');
    current.flush({
      ...testUser(Role.Admin),
      accessToken: 'admin-access',
      refreshToken: 'admin-rotated',
    });
    expect(result).toHaveBeenCalledTimes(2);
    expect(session.accessToken()).toBe('admin-access');
  });
});
