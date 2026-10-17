import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { roleGuard } from './role-guard';
import { Role } from '../models';
import { SessionService } from '../auth/session';
import { testUser } from '../../testing/fixtures';
describe('roleGuard', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));
  const run = () =>
    TestBed.runInInjectionContext(() =>
      roleGuard(
        { data: { roles: [Role.Admin] } } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    );
  it('blocks direct admin navigation from sales', () => {
    TestBed.inject(SessionService).login(testUser(Role.Sales));
    expect((run() as UrlTree).toString()).toBe('/dashboard');
  });
  it('allows admin navigation for admin', () => {
    TestBed.inject(SessionService).login(testUser(Role.Admin));
    expect(run()).toBe(true);
  });
});
