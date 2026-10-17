import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { authGuard } from './auth-guard';
import { SessionService } from '../auth/session';
import { testUser } from '../../testing/fixtures';
describe('authGuard', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));
  const run = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  it('redirects anonymous users to login', () =>
    expect((run() as UrlTree).toString()).toBe('/login'));
  it('allows an authenticated session', () => {
    TestBed.inject(SessionService).login(testUser());
    expect(run()).toBe(true);
  });
});
