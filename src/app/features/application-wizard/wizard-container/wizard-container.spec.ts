import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { WizardContainer } from './wizard-container';
import { SessionService } from '../../../core/auth/session';
import { ApplicationStatus } from '../../../core/models';
import { testApplication, testUser } from '../../../testing/fixtures';
describe('WizardContainer', () => {
  let backend: HttpTestingController;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  beforeEach(() => {
    params = new BehaviorSubject(convertToParamMap({ id: 'app-2' }));
    TestBed.configureTestingModule({
      imports: [WizardContainer],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: params.asObservable(),
            get snapshot() {
              return { paramMap: params.value };
            },
          },
        },
      ],
    });
    TestBed.inject(SessionService).login(testUser());
    backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    vi.useRealTimers();
    backend.verify();
  });
  function create() {
    const fixture = TestBed.createComponent(WizardContainer);
    backend
      .expectOne('/api/applications/app-2')
      .flush({ ...testApplication, status: ApplicationStatus.Draft });
    fixture.detectChanges();
    return fixture;
  }
  it('blocks progression until the current section is valid', () => {
    const fixture = create();
    const component = fixture.componentInstance;
    component.form.controls.businessName.setValue('   ');
    component.next();
    expect(component.step()).toBe(0);
    expect(component.form.controls.businessName.touched).toBe(true);
    fixture.destroy();
  });
  it('debounces draft changes, retains values on failure, and retries', () => {
    vi.useFakeTimers();
    const fixture = create();
    const component = fixture.componentInstance;
    component.form.controls.businessName.setValue('First');
    vi.advanceTimersByTime(400);
    backend.expectNone('/api/applications/app-2');
    component.form.controls.businessName.setValue('Latest');
    vi.advanceTimersByTime(799);
    backend.expectNone('/api/applications/app-2');
    vi.advanceTimersByTime(1);
    const save = backend.expectOne('/api/applications/app-2');
    expect(save.request.body.businessName).toBe('Latest');
    expect(save.request.body.taxId).toBeUndefined();
    expect(save.request.body.bankAccountNumber).toBeUndefined();
    save.flush({ message: 'Offline' }, { status: 503, statusText: 'Unavailable' });
    expect(component.form.controls.businessName.value).toBe('Latest');
    component.save();
    backend.expectOne('/api/applications/app-2').flush(testApplication);
    expect(component.draft.savedRevision()).toBe(component.revision());
    fixture.destroy();
  });
  it('leaves stored sensitive fields blank while keeping the form valid', () => {
    const fixture = create();
    const component = fixture.componentInstance;
    expect(component.form.controls.taxId.value).toBe('');
    expect(component.form.controls.bankAccountNumber.value).toBe('');
    expect(component.form.valid).toBe(true);
    fixture.destroy();
  });

  it('renders saved draft values after a delayed response without auto-saving hydration', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(WizardContainer);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Opening draft');
    backend.expectOne('/api/applications/app-2').flush({
      ...testApplication,
      status: ApplicationStatus.Draft,
      estimatedMonthlyVolume: 31415.75,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#businessName').value).toBe(
      testApplication.businessName,
    );
    expect(fixture.nativeElement.querySelector('#businessType').value).toBe(
      testApplication.businessType,
    );
    expect(fixture.nativeElement.querySelector('#registrationNumber').value).toBe(
      testApplication.registrationNumber,
    );
    fixture.componentInstance.next();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#contactName').value).toBe(
      testApplication.contactName,
    );
    expect(fixture.nativeElement.querySelector('#contactEmail').value).toBe(
      testApplication.contactEmail,
    );
    expect(fixture.nativeElement.querySelector('#contactPhone').value).toBe(
      testApplication.contactPhone,
    );
    fixture.componentInstance.next();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#monthlyVolumeOption').value).toBe('custom');
    expect(fixture.nativeElement.querySelector('#estimatedMonthlyVolume').value).toBe('31415.75');
    expect(fixture.nativeElement.querySelector('#taxId').value).toBe('');
    expect(fixture.nativeElement.querySelector('#bankAccountNumber').value).toBe('');
    expect(fixture.nativeElement.textContent).toContain(testApplication.taxId);
    expect(fixture.nativeElement.textContent).toContain(testApplication.bankAccountNumber);
    vi.advanceTimersByTime(1000);
    backend.expectNone(() => true);
    expect(fixture.componentInstance.revision()).toBe(0);
    fixture.destroy();
  });

  it('explains an existing empty draft without creating values or saving on load', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(WizardContainer);
    fixture.detectChanges();
    backend.expectOne('/api/applications/app-2').flush({
      ...testApplication,
      ...fixture.componentInstance.form.getRawValue(),
      status: ApplicationStatus.Draft,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('This draft has no saved details yet');
    expect(fixture.nativeElement.querySelector('#businessName').value).toBe('');
    vi.advanceTimersByTime(1000);
    backend.expectNone(() => true);
    fixture.destroy();
  });

  it('sends a custom monthly amount as a number through auto-save', () => {
    vi.useFakeTimers();
    const fixture = create();
    const component = fixture.componentInstance;
    component.step.set(2);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('#monthlyVolumeOption') as HTMLSelectElement;
    select.value = 'custom';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      '#estimatedMonthlyVolume',
    ) as HTMLInputElement;
    input.value = '1000000';
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(800);
    const save = backend.expectOne('/api/applications/app-2');
    expect(save.request.method).toBe('PATCH');
    expect(save.request.body.estimatedMonthlyVolume).toBe(1000000);
    save.flush(testApplication);
    expect(component.draft.error()).toBe('');
    fixture.destroy();
  });

  it('keeps invalid monthly volume local, then resumes auto-save after correction', () => {
    vi.useFakeTimers();
    const fixture = create();
    const component = fixture.componentInstance;
    component.step.set(2);
    component.form.controls.estimatedMonthlyVolume.setValue(1000000001);
    vi.advanceTimersByTime(800);
    backend.expectNone('/api/applications/app-2');
    expect(component.draft.error()).toContain('Correct the monthly volume');
    expect(component.form.controls.estimatedMonthlyVolume.value).toBe(1000000001);
    component.next();
    expect(component.step()).toBe(2);
    component.form.controls.estimatedMonthlyVolume.setValue(13750.5);
    vi.advanceTimersByTime(800);
    const save = backend.expectOne('/api/applications/app-2');
    expect(save.request.body.estimatedMonthlyVolume).toBe(13750.5);
    save.flush(testApplication);
    expect(component.draft.error()).toBe('');
    fixture.destroy();
  });

  function createUnsaved() {
    params.next(convertToParamMap({}));
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(WizardContainer);
    fixture.detectChanges();
    return fixture;
  }

  it('opens an unsaved form without creating or loading a record', () => {
    vi.useFakeTimers();
    const fixture = createUnsaved();
    vi.advanceTimersByTime(1000);
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.application()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Not saved yet');
    backend.expectNone(() => true);
    fixture.componentInstance.form.controls.businessName.setValue('   ');
    vi.advanceTimersByTime(800);
    backend.expectNone(() => true);
    fixture.destroy();
  });

  it('debounces creation and keeps newer edits and the current step during URL promotion', () => {
    vi.useFakeTimers();
    const fixture = createUnsaved();
    const component = fixture.componentInstance;
    component.form.controls.businessName.setValue('First');
    vi.advanceTimersByTime(400);
    component.form.controls.businessName.setValue('Demo Shop');
    vi.advanceTimersByTime(799);
    backend.expectNone(() => true);
    vi.advanceTimersByTime(1);
    const creation = backend.expectOne('/api/applications');
    expect(creation.request.method).toBe('POST');
    expect(creation.request.body.businessName).toBe('Demo Shop');
    component.step.set(1);
    component.form.controls.contactName.setValue('Newer Contact');
    vi.advanceTimersByTime(800);
    backend.expectNone('/api/applications');
    creation.flush({ ...testApplication, status: ApplicationStatus.Draft });
    fixture.detectChanges();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(
      ['/applications', 'app-2', 'edit'],
      { replaceUrl: true },
    );
    // Simulate the router updating params after the first save.
    params.next(convertToParamMap({ id: 'app-2' }));
    backend.expectNone((req) => req.method === 'GET');
    const update = backend.expectOne('/api/applications/app-2');
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body.contactName).toBe('Newer Contact');
    expect(component.form.controls.contactName.value).toBe('Newer Contact');
    expect(component.step()).toBe(1);
    update.flush(testApplication);
    expect(component.draft.savedRevision()).toBe(component.revision());
    fixture.destroy();
  });

  it('preserves the form after failed creation and creates successfully on retry', () => {
    vi.useFakeTimers();
    const fixture = createUnsaved();
    const component = fixture.componentInstance;
    component.form.controls.businessName.setValue('Retained Demo');
    vi.advanceTimersByTime(800);
    backend
      .expectOne('/api/applications')
      .flush({ message: 'Offline' }, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(component.application()).toBeNull();
    expect(component.form.controls.businessName.value).toBe('Retained Demo');
    const retry = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Retry save'))!;
    retry.click();
    const request = backend.expectOne('/api/applications');
    expect(request.request.body.businessName).toBe('Retained Demo');
    request.flush({ ...testApplication, status: ApplicationStatus.Draft });
    fixture.detectChanges();
    expect(component.application()?.id).toBe('app-2');
    expect(component.draft.error()).toBe('');
    fixture.destroy();
  });

  it('warns before leaving a new form with unsaved input', () => {
    const fixture = createUnsaved();
    const component = fixture.componentInstance;
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    expect(component.canLeave()).toBe(true);
    component.form.controls.businessName.setValue('Unsaved Demo');
    expect(component.canLeave()).toBe(false);
    expect(confirm).toHaveBeenCalledOnce();
    confirm.mockRestore();
    fixture.destroy();
  });
});
