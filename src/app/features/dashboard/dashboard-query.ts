import { Injectable, inject, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';
import { ApplicationsApi, ApplicationQuery } from '../../core/api/applications-api';
import { Application, PageResult } from '../../core/models';
import { apiError } from '../../core/api/api-error';

@Injectable({ providedIn: 'root' })
export class DashboardQuery {
  private readonly api = inject(ApplicationsApi);
  readonly query = signal<ApplicationQuery>({ search: '', status: '', page: 1, pageSize: 5 });
  readonly result = signal<PageResult<Application>>({ data: [], total: 0, page: 1, pageSize: 5 });
  readonly loading = signal(false);
  readonly error = signal('');
  constructor() {
    toObservable(this.query)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set('');
        }),
        switchMap((query) =>
          this.api.list(query).pipe(
            catchError((error) => {
              this.error.set(apiError(error));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        if (result) this.result.set(result);
        this.loading.set(false);
      });
  }
  filter(search: string, status: string) {
    this.query.update((q) => ({ ...q, search, status, page: 1 }));
  }
  page(page: number) {
    this.query.update((q) => ({ ...q, page }));
  }
  retry() {
    this.query.update((q) => ({ ...q }));
  }
}
