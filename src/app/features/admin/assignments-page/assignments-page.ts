import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin } from 'rxjs';
import { ApplicationsApi } from '../../../core/api/applications-api';
import { apiError } from '../../../core/api/api-error';
import { Application, PageResult } from '../../../core/models';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  selector: 'app-assignments-page',
  styleUrl: './assignments-page.scss',
  templateUrl: './assignments-page.html',
})
export class AssignmentsPage {
  private readonly api = inject(ApplicationsApi);
  readonly result = signal<PageResult<Application> | null>(null);
  readonly reviewers = signal<{ username: string }[]>([]);
  readonly loading = signal(false);
  readonly saving = signal('');
  readonly error = signal('');
  readonly message = signal('');
  readonly page = signal(1);
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      apps: this.api.list({ search: '', status: '', page: this.page(), pageSize: 5 }),
      reviewers: this.api.reviewers(),
    }).subscribe({
      next: (result) => {
        this.result.set(result.apps);
        this.reviewers.set(result.reviewers);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(apiError(error));
        this.loading.set(false);
      },
    });
  }
  assign(app: Application, value: string) {
    this.saving.set(app.id);
    this.error.set('');
    this.message.set('');
    this.api.assign(app.id, value || null).subscribe({
      next: () => {
        this.saving.set('');
        this.message.set('Assignment saved.');
        this.load();
      },
      error: (error) => {
        this.saving.set('');
        this.error.set(apiError(error));
      },
    });
  }
  changePage(change: number) {
    this.page.update((page) => page + change);
    this.load();
  }
}
