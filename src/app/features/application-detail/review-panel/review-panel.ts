import { Component, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Application, RiskDecision } from '../../../core/models';
import { ApplicationsApi } from '../../../core/api/applications-api';
import { PermissionService } from '../../../core/auth/permission';
import { apiError } from '../../../core/api/api-error';
import { notBlank } from '../../application-wizard/validators';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule],
  selector: 'app-review-panel',
  styleUrl: './review-panel.scss',
  templateUrl: './review-panel.html',
})
export class ReviewPanel {
  readonly application = input.required<Application>();
  readonly decided = output<void>();
  private readonly api = inject(ApplicationsApi);
  private readonly permission = inject(PermissionService);
  readonly comment = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      notBlank,
      (control) => (control.value.trim().length >= 10 ? null : { minlength: true }),
      Validators.maxLength(1000),
    ],
  });
  readonly busy = signal(false);
  readonly error = signal('');
  decide(decision: 'APPROVED' | 'REJECTED') {
    this.comment.markAsTouched();
    if (this.comment.invalid || this.busy() || !this.permission.canReview(this.application()))
      return;
    this.busy.set(true);
    this.error.set('');
    this.api
      .decide(this.application().id, decision as RiskDecision, this.comment.value.trim())
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.decided.emit();
        },
        error: (error) => {
          this.error.set(apiError(error));
          this.busy.set(false);
        },
      });
  }
}
