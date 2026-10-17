import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthApi } from './auth-api';
import { testUser } from '../../testing/fixtures';

describe('AuthApi', () => {
  it('exchanges a demo identity for the server-issued session', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const backend = TestBed.inject(HttpTestingController);
    const result = vi.fn();
    TestBed.inject(AuthApi).login('sales-user').subscribe(result);
    const request = backend.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ username: 'sales-user' });
    request.flush(testUser());
    expect(result).toHaveBeenCalledWith(testUser());
    backend.verify();
  });
});
