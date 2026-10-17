import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardQuery } from './dashboard-query';
import { testApplication } from '../../testing/fixtures';
describe('DashboardQuery', () => {
  let state: DashboardQuery;
  let backend: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    state = TestBed.inject(DashboardQuery);
    backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => backend.verify());
  it('sends filters and page to the server and resets page when filtering', () => {
    TestBed.tick();
    backend
      .expectOne((req) => req.url === '/api/applications' && req.params.get('page') === '1')
      .flush({ data: [testApplication], total: 12, page: 1, pageSize: 5 });
    state.page(2);
    TestBed.tick();
    backend
      .expectOne((req) => req.params.get('page') === '2')
      .flush({ data: [], total: 12, page: 2, pageSize: 5 });
    state.filter('Demo', 'SUBMITTED');
    TestBed.tick();
    const request = backend.expectOne(
      (req) =>
        req.params.get('search') === 'Demo' &&
        req.params.get('status') === 'SUBMITTED' &&
        req.params.get('page') === '1',
    );
    request.flush({ data: [testApplication], total: 1, page: 1, pageSize: 5 });
    expect(state.result().total).toBe(1);
    expect(state.loading()).toBe(false);
  });
  it('shows failures and retries without losing filters', () => {
    state.filter('Demo', 'SUBMITTED');
    TestBed.tick();
    backend
      .expectOne((req) => req.url === '/api/applications')
      .flush({ message: 'Temporary error' }, { status: 500, statusText: 'Error' });
    expect(state.error()).toBe('Temporary error');
    state.retry();
    TestBed.tick();
    backend
      .expectOne((req) => req.params.get('search') === 'Demo')
      .flush({ data: [], total: 0, page: 1, pageSize: 5 });
    expect(state.error()).toBe('');
  });
});
