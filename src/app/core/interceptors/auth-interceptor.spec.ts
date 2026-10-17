import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './auth-interceptor';
import { SessionService } from '../auth/session';
import { testUser } from '../../testing/fixtures';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let session: SessionService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
    session.login(testUser());
  });
  afterEach(() => backend.verify());
  it('attaches bearer tokens only to our API, excluding auth endpoints', () => {
    http.get('/api/applications').subscribe();
    const api = backend.expectOne('/api/applications');
    expect(api.request.headers.get('Authorization')).toBe('Bearer test-access');
    api.flush([]);
    http.get('https://example.test/third-party').subscribe();
    const external = backend.expectOne('https://example.test/third-party');
    expect(external.request.headers.has('Authorization')).toBe(false);
    external.flush({});
    http.post('/api/auth/login', {}).subscribe();
    const login = backend.expectOne('/api/auth/login');
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush({});
  });
  it('shares one refresh across concurrent 401s and handles a late stale 401', () => {
    const results: unknown[] = [];
    ['/api/a', '/api/b', '/api/late'].forEach((url) =>
      http.get(url).subscribe((result) => results.push(result)),
    );
    const a = backend.expectOne('/api/a');
    const b = backend.expectOne('/api/b');
    const late = backend.expectOne('/api/late');
    a.flush({}, { status: 401, statusText: 'Unauthorized' });
    b.flush({}, { status: 401, statusText: 'Unauthorized' });
    const refresh = backend.expectOne('/api/auth/refresh');
    expect(refresh.request.method).toBe('POST');
    expect(refresh.request.body.refreshToken).toBe('test-refresh');
    refresh.flush({ ...testUser(), accessToken: 'new-access', refreshToken: 'new-refresh' });
    late.flush({}, { status: 401, statusText: 'Unauthorized' });
    for (const url of ['/api/a', '/api/b', '/api/late']) {
      const retry = backend.expectOne(url);
      expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
      retry.flush({ ok: true });
    }
    backend.expectNone('/api/auth/refresh');
    expect(results.length).toBe(3);
  });
  it('never refreshes twice if a retried request still returns 401', () => {
    const error = vi.fn();
    http.get('/api/a').subscribe({ error });
    backend.expectOne('/api/a').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend
      .expectOne('/api/auth/refresh')
      .flush({ ...testUser(), accessToken: 'new-access', refreshToken: 'new-refresh' });
    backend.expectOne('/api/a').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectNone('/api/auth/refresh');
    expect(error).toHaveBeenCalledOnce();
  });
  it('logs out and releases all waiters when refresh fails', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const error = vi.fn();
    http.get('/api/a').subscribe({ error });
    http.get('/api/b').subscribe({ error });
    backend.expectOne('/api/a').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/b').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.user()).toBeNull();
    expect(error).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('refreshes once before concurrent reads and a PATCH use an expired token', () => {
    session.login({ ...testUser(), accessTokenExpiresAt: Date.now() - 1 });
    const saved = vi.fn();
    const body = { businessName: 'Retained Demo Shop' };
    http.patch('/api/applications/app-2', body).subscribe(saved);
    http.get('/api/applications/app-2/history').subscribe();
    backend.expectNone('/api/applications/app-2');
    backend.expectNone('/api/applications/app-2/history');
    const expiresAt = Date.now() + 45000;
    backend.expectOne('/api/auth/refresh').flush({
      ...testUser(),
      accessToken: 'fresh-access',
      refreshToken: 'fresh-refresh',
      accessTokenExpiresAt: expiresAt,
    });
    const patch = backend.expectOne('/api/applications/app-2');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual(body);
    expect(patch.request.headers.get('Authorization')).toBe('Bearer fresh-access');
    patch.flush({ saved: true });
    const history = backend.expectOne('/api/applications/app-2/history');
    expect(history.request.headers.get('Authorization')).toBe('Bearer fresh-access');
    history.flush([]);
    expect(saved).toHaveBeenCalledWith({ saved: true });
    expect(session.user()?.accessTokenExpiresAt).toBe(expiresAt);
    backend.expectNone('/api/auth/refresh');
  });

  it('refreshes within the expiry margin but sends a fresh token directly', () => {
    session.login({ ...testUser(), accessTokenExpiresAt: Date.now() + 45000 });
    http.get('/api/fresh').subscribe();
    backend.expectOne('/api/fresh').flush({});
    backend.expectNone('/api/auth/refresh');
    session.login({ ...testUser(), accessTokenExpiresAt: Date.now() + 4000 });
    http.get('/api/near-expiry').subscribe();
    backend.expectNone('/api/near-expiry');
    backend.expectOne('/api/auth/refresh').flush({
      ...testUser(),
      accessToken: 'fresh-access',
      refreshToken: 'fresh-refresh',
      accessTokenExpiresAt: Date.now() + 45000,
    });
    backend.expectOne('/api/near-expiry').flush({});
  });

  it('fails waiting calls without sending expired tokens when proactive refresh fails', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    session.login({ ...testUser(), accessTokenExpiresAt: Date.now() - 1 });
    const error = vi.fn();
    http.patch('/api/applications/app-2', { businessName: 'Retained Demo' }).subscribe({ error });
    http.get('/api/applications/app-2/history').subscribe({ error });
    backend.expectOne('/api/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectNone('/api/applications/app-2');
    backend.expectNone('/api/applications/app-2/history');
    expect(error).toHaveBeenCalledTimes(2);
    expect(session.user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not loop if the server rejects a proactively refreshed request', () => {
    session.login({ ...testUser(), accessTokenExpiresAt: Date.now() - 1 });
    const error = vi.fn();
    http.get('/api/applications/app-2').subscribe({ error });
    backend.expectOne('/api/auth/refresh').flush({
      ...testUser(),
      accessToken: 'fresh-access',
      refreshToken: 'fresh-refresh',
      accessTokenExpiresAt: Date.now() + 45000,
    });
    backend
      .expectOne('/api/applications/app-2')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectNone('/api/auth/refresh');
    expect(error).toHaveBeenCalledOnce();
  });

  it('retries an unexpected PATCH 401 once with its method and body intact', () => {
    const saved = vi.fn();
    const body = { businessName: 'Retained Demo' };
    http.patch('/api/applications/app-2', body).subscribe(saved);
    backend
      .expectOne('/api/applications/app-2')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/auth/refresh').flush({
      ...testUser(),
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    const retry = backend.expectOne('/api/applications/app-2');
    expect(retry.request.method).toBe('PATCH');
    expect(retry.request.body).toEqual(body);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
    retry.flush({ saved: true });
    expect(saved).toHaveBeenCalledWith({ saved: true });
  });
});
