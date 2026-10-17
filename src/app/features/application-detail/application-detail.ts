import { Injectable, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApplicationsApi } from '../../core/api/applications-api';
import { apiError } from '../../core/api/api-error';
import { Application, RiskHistoryEntry } from '../../core/models';

@Injectable()
export class ApplicationDetail {
  private readonly api = inject(ApplicationsApi);
  private readonly destroy = inject(DestroyRef);
  readonly application = signal<Application | null>(null);
  readonly history = signal<RiskHistoryEntry[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  load(id: string) {
    this.loading.set(true);
    this.error.set('');
    this.application.set(null);
    // Concurrent calls share token refresh, including unexpected 401 recovery.
    forkJoin({ application: this.api.get(id), history: this.api.history(id) })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (result) => {
          this.application.set(result.application);
          this.history.set(result.history);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(apiError(error));
          this.loading.set(false);
        },
      });
  }
}
