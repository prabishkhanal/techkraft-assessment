import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardQuery } from '../dashboard-query';
import { PermissionService } from '../../../core/auth/permission';
import { ApplicationStatus } from '../../../core/models';
import { ApplicationsTable } from '../applications-table/applications-table';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, ApplicationsTable],
  providers: [DashboardQuery],
  selector: 'app-dashboard-page',
  styleUrl: './dashboard-page.scss',
  templateUrl: './dashboard-page.html',
})
export class DashboardPage {
  readonly state = inject(DashboardQuery);
  readonly permission = inject(PermissionService);
  readonly statuses = Object.values(ApplicationStatus);
  readonly filters = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl('', { nonNullable: true }),
  });
  constructor() {
    this.filters.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => {
      const { search, status } = this.filters.getRawValue();
      this.state.filter(search.trim(), status);
    });
  }
}
