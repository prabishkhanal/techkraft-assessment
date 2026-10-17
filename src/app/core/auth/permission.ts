import { Injectable, inject } from '@angular/core';
import { Application, ApplicationStatus } from '../models/application';
import { Role } from '../models/role';
import { SessionService } from './session';

/** UI permissions. The API independently enforces the same rules. */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly session = inject(SessionService);
  private get role(): Role | null {
    return this.session.role();
  }
  private get currentUser(): string | null {
    return this.session.username();
  }

  canCreateOrEdit(): boolean {
    return this.role === Role.Sales;
  }

  canEditApplication(app: Application): boolean {
    return (
      this.canCreateOrEdit() &&
      app.createdBy === this.currentUser &&
      app.status === ApplicationStatus.Draft
    );
  }

  canViewApplication(app: Application): boolean {
    switch (this.role) {
      case Role.Sales:
        return app.createdBy === this.currentUser;
      case Role.Reviewer:
        return app.assignedTo === this.currentUser;
      case Role.Admin:
        return true;
      default:
        return false;
    }
  }

  /** Only the assigned reviewer can decide a pending application. */
  canReview(app: Application): boolean {
    return (
      this.role === Role.Reviewer &&
      app.assignedTo === this.currentUser &&
      [ApplicationStatus.Submitted, ApplicationStatus.UnderReview].includes(app.status)
    );
  }

  canReveal(app: Application): boolean {
    return (
      this.role === Role.Admin ||
      (this.role === Role.Reviewer && app.assignedTo === this.currentUser)
    );
  }

  canManageAssignments(): boolean {
    return this.role === Role.Admin;
  }
}
