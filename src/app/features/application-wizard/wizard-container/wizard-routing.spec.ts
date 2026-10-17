import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NavigationEnd, Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { filter, firstValueFrom } from 'rxjs';
import { routes } from '../../../app.routes';
import { SessionService } from '../../../core/auth/session';
import { ApplicationStatus } from '../../../core/models';
import { testApplication, testUser } from '../../../testing/fixtures';
import { WizardContainer } from './wizard-container';

describe('Wizard routing', () => {
  let backend: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(SessionService).login(testUser());
    backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => backend.verify());

  it('retains the live wizard and queued edits when create becomes an edit URL', async () => {
    const harness = await RouterTestingHarness.create('/applications/create');
    const router = TestBed.inject(Router);
    const wizard = () =>
      harness.fixture.debugElement.query(By.directive(WizardContainer))
        .componentInstance as WizardContainer;
    const component = wizard();
    backend.expectNone(() => true);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.form.patchValue({
      businessName: 'Demo Shop',
      businessType: 'Retail',
      registrationNumber: 'DEMO-NEW',
    });
    component.next();
    component.save();
    const creation = backend.expectOne('/api/applications');
    component.form.controls.contactName.setValue('Latest Demo Contact');
    component.save();
    const promoted = firstValueFrom(
      router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    );
    creation.flush({ ...testApplication, status: ApplicationStatus.Draft });
    const update = backend.expectOne('/api/applications/app-2');
    TestBed.tick();
    await promoted;
    expect(router.url).toBe('/applications/app-2/edit');
    expect(wizard()).toBe(component);
    expect(component.step()).toBe(1);
    expect(component.form.controls.contactName.value).toBe('Latest Demo Contact');
    expect(update.cancelled).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
    backend.expectNone((request) => request.method === 'GET');
    update.flush(testApplication);

    // A later New application action starts a fresh form using the same route.
    await router.navigateByUrl('/applications/create');
    harness.detectChanges();
    expect(wizard().application()).toBeNull();
    expect(wizard().step()).toBe(0);
    expect(wizard().form.controls.businessName.value).toBe('');
    backend.expectNone(() => true);
    confirm.mockRestore();
  });

  it('protects unsaved create input when switching to another wizard URL', async () => {
    const harness = await RouterTestingHarness.create('/applications/create');
    const component = harness.fixture.debugElement.query(By.directive(WizardContainer))
      .componentInstance as WizardContainer;
    component.form.controls.businessName.setValue('Unsaved Demo');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    expect(await TestBed.inject(Router).navigateByUrl('/applications/app-2/edit')).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/applications/create');
    expect(component.form.controls.businessName.value).toBe('Unsaved Demo');
    backend.expectNone(() => true);
    confirm.mockRestore();
  });

  it('restores saved fields after leaving the wizard and reopening Edit draft', async () => {
    const harness = await RouterTestingHarness.create('/applications/create');
    const router = TestBed.inject(Router);
    const component = harness.fixture.debugElement.query(By.directive(WizardContainer))
      .componentInstance as WizardContainer;
    const values = {
      businessName: 'Saved Demo Shop',
      businessType: 'Services',
      registrationNumber: 'DEMO-SAVED',
      contactName: 'Demo Contact',
      contactEmail: 'saved@example.test',
      contactPhone: '+1 202 555 0100',
      estimatedMonthlyVolume: 23456.75,
    };
    component.form.patchValue(values);
    component.save();
    const create = backend.expectOne('/api/applications');
    const saved = { ...testApplication, ...create.request.body, status: ApplicationStatus.Draft };
    const promoted = firstValueFrom(
      router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    );
    create.flush(saved);
    TestBed.tick();
    await promoted;
    await router.navigateByUrl('/applications/app-2');
    backend.expectOne('/api/applications/app-2').flush(saved);
    backend.expectOne('/api/applications/app-2/history').flush([]);
    harness.detectChanges();
    await router.navigateByUrl('/applications/app-2/edit');
    harness.detectChanges();
    backend.expectOne('/api/applications/app-2').flush(saved);
    harness.detectChanges();
    const reopened = harness.fixture.debugElement.query(By.directive(WizardContainer))
      .componentInstance as WizardContainer;
    expect(reopened).not.toBe(component);
    expect(harness.fixture.nativeElement.querySelector('#businessName').value).toBe(
      values.businessName,
    );
    expect(harness.fixture.nativeElement.querySelector('#businessType').value).toBe(
      values.businessType,
    );
    expect(harness.fixture.nativeElement.querySelector('#registrationNumber').value).toBe(
      values.registrationNumber,
    );
    expect(reopened.form.getRawValue()).toMatchObject(values);
    expect(reopened.revision()).toBe(0);
    backend.expectNone(() => true);
  });
});
