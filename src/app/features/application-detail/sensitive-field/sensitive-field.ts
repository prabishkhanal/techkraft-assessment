import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Application } from '../../../core/models';
import { PermissionService } from '../../../core/auth/permission';
import { ApplicationsApi } from '../../../core/api/applications-api';
import { apiError } from '../../../core/api/api-error';

@Component({
  standalone: true,
  imports: [MatButtonModule],
  selector: 'app-sensitive-field',
  styleUrl: './sensitive-field.scss',
  templateUrl: './sensitive-field.html',
})
export class SensitiveField {
  readonly application = input.required<Application>();
  readonly permission = inject(PermissionService);
  private readonly api = inject(ApplicationsApi);
  private readonly destroy = inject(DestroyRef);
  readonly revealed = signal<Pick<Application, 'taxId' | 'bankAccountNumber'> | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  private timer?: ReturnType<typeof setTimeout>;
  constructor() {
    this.destroy.onDestroy(() => clearTimeout(this.timer));
  }
  toggle() {
    if (this.revealed()) {
      this.hide();
      return;
    }
    if (!this.permission.canReveal(this.application()) || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.api
      .sensitive(this.application().id)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (values) => {
          this.revealed.set(values);
          this.busy.set(false);
          this.timer = setTimeout(() => this.hide(), 15000);
        },
        error: (error) => {
          this.error.set(apiError(error));
          this.busy.set(false);
        },
      });
  }
  hide() {
    clearTimeout(this.timer);
    this.revealed.set(null);
  }
}
