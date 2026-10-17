import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SensitiveField } from './sensitive-field';
import { testApplication, testUser } from '../../../testing/fixtures';
import { SessionService } from '../../../core/auth/session';
import { Role } from '../../../core/models';
describe('SensitiveField', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [SensitiveField],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => {
    vi.useRealTimers();
    TestBed.inject(HttpTestingController).verify();
  });
  function create(role: Role) {
    TestBed.inject(SessionService).login(testUser(role));
    const fixture = TestBed.createComponent(SensitiveField);
    fixture.componentRef.setInput('application', testApplication);
    fixture.detectChanges();
    return fixture;
  }
  it('keeps sensitive values masked and prevents sales from revealing', () => {
    const fixture = create(Role.Sales);
    expect(fixture.nativeElement.textContent).toContain('••••1234');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    fixture.componentInstance.toggle();
    TestBed.inject(HttpTestingController).expectNone('/api/applications/app-2/sensitive');
  });
  it('fetches an authorized reveal on demand and masks it again after 15 seconds', () => {
    vi.useFakeTimers();
    const fixture = create(Role.Reviewer);
    expect(fixture.componentInstance.revealed()).toBeNull();
    fixture.componentInstance.toggle();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/applications/app-2/sensitive')
      .flush({ taxId: '900000001', bankAccountNumber: '000000001234' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('000000001234');
    vi.advanceTimersByTime(15000);
    fixture.detectChanges();
    expect(fixture.componentInstance.revealed()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('000000001234');
    fixture.destroy();
  });
});
