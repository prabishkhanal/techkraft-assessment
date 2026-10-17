import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApplicationsApi } from './applications-api';
import { testApplication } from '../../testing/fixtures';

describe('ApplicationsApi', () => {
  let api: ApplicationsApi;
  let backend: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApplicationsApi);
    backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => backend.verify());

  it('sends filters and pagination to the server', () => {
    const query = { search: 'Demo Shop', status: 'SUBMITTED', page: 2, pageSize: 5 };
    const result = vi.fn();
    api.list(query).subscribe(result);
    const request = backend.expectOne((req) => req.url === '/api/applications');
    expect(request.request.method).toBe('GET');
    for (const [key, value] of Object.entries(query)) {
      expect(request.request.params.get(key)).toBe(String(value));
    }
    const page = { data: [testApplication], total: 6, page: 2, pageSize: 5 };
    request.flush(page);
    expect(result).toHaveBeenCalledWith(page);
  });

  it('patches only the supplied fields so stored sensitive values are preserved', () => {
    api.save('app-2', { businessName: 'Updated demo' }).subscribe();
    const request = backend.expectOne('/api/applications/app-2');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ businessName: 'Updated demo' });
    request.flush(testApplication);
  });

  it('retrieves sensitive values through a separate endpoint', () => {
    api.sensitive('app-2').subscribe();
    const request = backend.expectOne('/api/applications/app-2/sensitive');
    expect(request.request.method).toBe('GET');
    request.flush({ taxId: '900000001', bankAccountNumber: '000000001234' });
  });
});
