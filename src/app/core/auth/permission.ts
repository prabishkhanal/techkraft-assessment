import { Injectable, inject } from '@angular/core';
import { Application } from '../models/application';
import { Role } from '../models/role';
import { SessionService } from './session';

/**
 * PermissionService — the ONLY place authorization rules live.
 *
 * Every guard, component, and template checks permissions through this
 * service. No other file should contain role-comparison logic.
 *
 * Rules are grounded in the assignment brief and DECISIONS.md:
 *  - §3: Approve/reject → REVIEWER only, on assigned applications.
 *  - §4: Sensitive reveal → REVIEWER (assigned) and ADMIN; never SALES.
 *  - §5: Manage assignments → ADMIN only.
 *  - Brief §2: SALES creates/edits; REVIEWER reviews assigned; ADMIN views all.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {

  private readonly session = inject(SessionService);

  // ─── Helpers ────────────────────────────────────────────────

  /** Current role, or null when logged out. */
  private get role(): Role | null {
    return this.session.role();
  }

  /** Current username, or null when logged out. */
  private get currentUser(): string | null {
    return this.session.username();
  }

  // ─── Public permission checks ──────────────────────────────

  /**
   * Can the current user create a new application or edit a draft?
   * Brief: "SALES — creates and edits merchant applications."
   */
  canCreateOrEdit(): boolean {
    return this.role === Role.Sales;
  }

  /**
   * Can the current user view this specific application?
   *
   * - SALES  → only applications they created.
   * - REVIEWER → only applications assigned to them.
   * - ADMIN → all applications.
   */
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

  /**
   * Can the current user approve or reject this application?
   *
   * DECISIONS.md §3: "Only REVIEWER, and only on applications assigned to them.
   * ADMIN cannot approve or reject."
   */
  canReview(app: Application): boolean {
    return this.role === Role.Reviewer && app.assignedTo === this.currentUser;
  }

  /**
   * Can the current user unmask sensitive fields on a given application?
   *
   * DECISIONS.md §4:
   *  - REVIEWER can reveal on applications assigned to them.
   *  - ADMIN can reveal on any application.
   *  - SALES never reveals.
   */
  canReveal(app: Application): boolean {
    switch (this.role) {
      case Role.Reviewer:
        return app.assignedTo === this.currentUser;
      case Role.Admin:
        return true;
      default:
        return false;
    }
  }

  /**
   * Can the current user manage reviewer assignments?
   *
   * DECISIONS.md §5 / Brief §2: "ADMIN can view all applications and
   * manage assignments."
   */
  canManageAssignments(): boolean {
    return this.role === Role.Admin;
  }
}
