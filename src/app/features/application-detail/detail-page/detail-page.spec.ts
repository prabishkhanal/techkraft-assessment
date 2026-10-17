import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { DetailPage } from './detail-page';
import { SessionService } from '../../../core/auth/session';
import { Role } from '../../../core/models';
import { testApplication, testUser } from '../../../testing/fixtures';
describe('DetailPage permission-aware controls', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [DetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'app-2' }) } },
        },
      ],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  function create(role: Role) {
    TestBed.inject(SessionService).login(testUser(role));
    const fixture = TestBed.createComponent(DetailPage);
    const backend = TestBed.inject(HttpTestingController);
    backend.expectOne('/api/applications/app-2').flush(testApplication);
    backend.expectOne('/api/applications/app-2/history').flush([]);
    fixture.detectChanges();
    return fixture;
  }
  it('hides review and reveal controls from sales', () => {
    const fixture = create(Role.Sales);
    expect(fixture.nativeElement.querySelector('app-review-panel')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Reveal for');
  });
  it('shows review and reveal controls to the assigned reviewer', () => {
    const fixture = create(Role.Reviewer);
    expect(fixture.nativeElement.querySelector('app-review-panel')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Reveal for 15 seconds');
  });
  it('lets admin reveal but does not show reviewer decisions', () => {
    const fixture = create(Role.Admin);
    expect(fixture.nativeElement.querySelector('app-review-panel')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Reveal for 15 seconds');
  });
});
