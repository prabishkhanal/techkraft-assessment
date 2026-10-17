import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { SessionService } from '../../../core/auth/session';
import { testUser } from '../../../testing/fixtures';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      imports: [Login],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('submits from the actual button, establishes the session, and opens the dashboard', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ username: 'sales-user' });
    request.flush(testUser());
    expect(TestBed.inject(SessionService).user()).toEqual(testUser());
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('shows an API error and lets the user retry', () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    TestBed.inject(HttpTestingController).expectOne('/api/auth/login').flush(
      { message: 'API unavailable' }, { status: 503, statusText: 'Unavailable' },
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('API unavailable');
    expect(component.busy()).toBe(false);
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    TestBed.inject(HttpTestingController).expectOne('/api/auth/login').flush(testUser());
  });
});
