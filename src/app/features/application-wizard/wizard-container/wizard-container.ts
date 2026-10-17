import { Component, DestroyRef, HostListener, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Subject, debounceTime, startWith, switchMap, takeUntil } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApplicationsApi, ApplicationInput } from '../../../core/api/applications-api';
import { apiError } from '../../../core/api/api-error';
import { PermissionService } from '../../../core/auth/permission';
import { ApplicationStatus } from '../../../core/models';
import { ApplicationDraft } from '../application-draft';
import { createMerchantForm } from '../merchant-form';
import { StepOne } from '../steps/step-one/step-one';
import { StepTwo } from '../steps/step-two/step-two';
import { StepThree } from '../steps/step-three/step-three';
import { ReviewSummary } from '../steps/review-summary/review-summary';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    StepOne,
    StepTwo,
    StepThree,
    ReviewSummary,
  ],
  providers: [ApplicationDraft],
  selector: 'app-wizard-container',
  styleUrl: './wizard-container.scss',
  templateUrl: './wizard-container.html',
})
export class WizardContainer {
  private readonly api = inject(ApplicationsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionService);
  private readonly destroy = inject(DestroyRef);
  readonly draft = inject(ApplicationDraft);
  readonly form = createMerchantForm();
  readonly application = this.draft.application;
  readonly error = signal('');
  readonly loading = signal(true);
  readonly step = signal(0);
  readonly revision = signal(0);
  readonly submitting = signal(false);
  readonly steps = ['Business', 'Contact', 'Financial', 'Review'];
  private savedTax = false;
  private savedBank = false;
  private promotedId: string | null = null;
  private readonly routeChanged = new Subject<void>();
  private readonly stepFields = [
    ['businessName', 'businessType', 'registrationNumber'],
    ['contactName', 'contactEmail', 'contactPhone'],
    ['taxId', 'bankAccountNumber', 'estimatedMonthlyVolume'],
  ] as const;
  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      // The create-to-edit transition reuses this wizard and its in-flight save queue.
      if (params.get('id') && params.get('id') === this.application()?.id) return;
      this.load();
    });
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.revision.update((value) => value + 1));
    // Restart the debounce when switching records so an old timer cannot save a new form.
    this.routeChanged
      .pipe(
        startWith(undefined),
        switchMap(() => this.form.valueChanges.pipe(debounceTime(800))),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (!this.submitting()) this.save();
      });
    effect(() => {
      const submitted = this.draft.submitted();
      if (submitted) void this.router.navigate(['/applications', submitted.id]);
      const app = this.application();
      if (
        app &&
        !submitted &&
        !this.route.snapshot.paramMap.get('id') &&
        this.promotedId !== app.id
      ) {
        this.promotedId = app.id;
        void this.router.navigate(['/applications', app.id, 'edit'], { replaceUrl: true });
      }
      if (this.draft.error()) this.submitting.set(false);
    });
  }
  load() {
    this.routeChanged.next();
    this.draft.reset();
    // Restore the original required validators after leaving an existing draft.
    const defaults = createMerchantForm();
    this.form.reset(defaults.getRawValue(), { emitEvent: false });
    this.form.controls.taxId.setValidators(defaults.controls.taxId.validator);
    this.form.controls.bankAccountNumber.setValidators(
      defaults.controls.bankAccountNumber.validator,
    );
    this.form.controls.taxId.updateValueAndValidity({ emitEvent: false });
    this.form.controls.bankAccountNumber.updateValueAndValidity({ emitEvent: false });
    this.savedTax = false;
    this.savedBank = false;
    this.promotedId = null;
    this.step.set(0);
    this.revision.set(0);
    this.submitting.set(false);
    this.error.set('');
    this.loading.set(true);
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.api
      .get(id)
      .pipe(takeUntil(this.routeChanged), takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (app) => {
          if (
            !this.permissions.canCreateOrEdit() ||
            !this.permissions.canViewApplication(app) ||
            app.status !== ApplicationStatus.Draft
          ) {
            this.error.set('Only your own draft can be edited.');
            this.loading.set(false);
            return;
          }
          this.application.set(app);
          this.savedTax = !!app.taxId;
          this.savedBank = !!app.bankAccountNumber;
          this.form.patchValue({ ...app, taxId: '', bankAccountNumber: '' }, { emitEvent: false });
          const hasSavedDetails = [
            ...Object.values(this.form.getRawValue()),
            app.taxId,
            app.bankAccountNumber,
          ].some((value) => (typeof value === 'string' ? !!value.trim() : !!value));
          this.draft.message.set(
            hasSavedDetails
              ? 'Draft loaded'
              : 'This draft has no saved details yet. Enter merchant information to continue.',
          );
          // Empty sensitive controls preserve the stored value; replacements are validated.
          if (this.savedTax)
            this.form.controls.taxId.setValidators((control) =>
              !control.value || /^\d{9}$/.test(control.value)
                ? null
                : { digits: { min: 9, max: 9 } },
            );
          if (this.savedBank)
            this.form.controls.bankAccountNumber.setValidators((control) =>
              !control.value || /^\d{8,18}$/.test(control.value)
                ? null
                : { digits: { min: 8, max: 18 } },
            );
          this.form.controls.taxId.updateValueAndValidity({ emitEvent: false });
          this.form.controls.bankAccountNumber.updateValueAndValidity({ emitEvent: false });
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(apiError(error));
          this.loading.set(false);
        },
      });
  }
  save(submit = false) {
    const app = this.application();
    if (
      this.loading() ||
      this.error() ||
      this.draft.submitted() ||
      !this.permissions.canCreateOrEdit()
    )
      return;
    const data: Partial<ApplicationInput> = this.form.getRawValue();
    data.estimatedMonthlyVolume = data.estimatedMonthlyVolume ?? 0;
    // Drafts may omit volume (0), but invalid numeric amounts must stay local.
    if (
      !Number.isFinite(data.estimatedMonthlyVolume) ||
      data.estimatedMonthlyVolume < 0 ||
      data.estimatedMonthlyVolume > 1e9
    ) {
      this.form.controls.estimatedMonthlyVolume.markAsTouched();
      this.draft.error.set(
        'Correct the monthly volume before saving. Use an amount from USD 1 to 1,000,000,000.',
      );
      this.draft.message.set('Draft not saved. Your changes remain in this form.');
      return;
    }
    if (
      !app &&
      !Object.values(data).some((value) => (typeof value === 'string' ? !!value.trim() : !!value))
    )
      return;
    if (!data.taxId && this.savedTax) delete data.taxId;
    if (!data.bankAccountNumber && this.savedBank) delete data.bankAccountNumber;
    this.draft.save(app?.id ?? null, data, this.revision(), submit);
  }
  next() {
    const fields = this.stepFields[this.step()];
    if (fields) {
      fields.forEach((field) => this.form.controls[field].markAsTouched());
      if (fields.some((field) => this.form.controls[field].invalid)) return;
    }
    this.step.update((step) => Math.min(3, step + 1));
  }
  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.save(true);
  }
  canLeave() {
    return (
      !!this.draft.submitted() ||
      (this.revision() === this.draft.savedRevision() && !this.draft.busy()) ||
      window.confirm('Some changes have not been saved. Leave this draft?')
    );
  }
  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent) {
    if (this.revision() !== this.draft.savedRevision() || this.draft.busy()) event.preventDefault();
  }
}
