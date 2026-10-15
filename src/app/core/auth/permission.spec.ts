import { TestBed } from '@angular/core/testing';
import { PermissionService } from './permission';
import { SessionService } from './session';
import { Application, ApplicationStatus, Role, SessionUser } from '../models';

// ─── Test helpers ──────────────────────────────────────────────

/** Build a minimal SessionUser for a given role. */
function fakeUser(role: Role, username = `${role.toLowerCase()}-user`): SessionUser {
  return {
    username,
    role,
    accessToken: 'fake-access-token',
    refreshToken: 'fake-refresh-token',
  };
}

/** Build a minimal Application with the fields the permission service inspects. */
function fakeApp(overrides: Partial<Application> = {}): Application {
  return {
    id: 'app-1',
    createdBy: 'sales-user',
    assignedTo: 'reviewer-user',
    status: ApplicationStatus.Submitted,
    businessName: 'Acme Inc',
    businessType: 'LLC',
    registrationNumber: 'REG-001',
    contactName: 'Jane Doe',
    contactEmail: 'jane@example.com',
    contactPhone: '555-0100',
    taxId: '12-3456789',
    bankAccountNumber: '****1234',
    estimatedMonthlyVolume: 50000,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ─── Test suite ────────────────────────────────────────────────

describe('PermissionService', () => {
  let permission: PermissionService;
  let session: SessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    permission = TestBed.inject(PermissionService);
    session = TestBed.inject(SessionService);
  });

  /** Log in as a specific role before running assertions. */
  function loginAs(role: Role, username?: string): void {
    session.login(fakeUser(role, username));
  }

  // ──────────────────────────────────────────────────────────────
  // canCreateOrEdit()
  // Brief: "SALES — creates and edits merchant applications."
  // ──────────────────────────────────────────────────────────────

  describe('canCreateOrEdit()', () => {
    it('SALES → true', () => {
      loginAs(Role.Sales);
      expect(permission.canCreateOrEdit()).toBe(true);
    });

    it('REVIEWER → false', () => {
      loginAs(Role.Reviewer);
      expect(permission.canCreateOrEdit()).toBe(false);
    });

    it('ADMIN → false', () => {
      loginAs(Role.Admin);
      expect(permission.canCreateOrEdit()).toBe(false);
    });

    it('logged out → false', () => {
      expect(permission.canCreateOrEdit()).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // canViewApplication(app)
  // SALES sees own; REVIEWER sees assigned; ADMIN sees all.
  // ──────────────────────────────────────────────────────────────

  describe('canViewApplication()', () => {
    const app = fakeApp({ createdBy: 'sales-user', assignedTo: 'reviewer-user' });

    it('SALES → true when they created the app', () => {
      loginAs(Role.Sales, 'sales-user');
      expect(permission.canViewApplication(app)).toBe(true);
    });

    it('SALES → false for someone else\'s app', () => {
      loginAs(Role.Sales, 'other-sales');
      expect(permission.canViewApplication(app)).toBe(false);
    });

    it('REVIEWER → true when assigned to them', () => {
      loginAs(Role.Reviewer, 'reviewer-user');
      expect(permission.canViewApplication(app)).toBe(true);
    });

    it('REVIEWER → false when not assigned to them', () => {
      loginAs(Role.Reviewer, 'other-reviewer');
      expect(permission.canViewApplication(app)).toBe(false);
    });

    it('ADMIN → true for any application', () => {
      loginAs(Role.Admin);
      expect(permission.canViewApplication(app)).toBe(true);
    });

    it('logged out → false', () => {
      expect(permission.canViewApplication(app)).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // canReview(app)
  // DECISIONS.md §3: REVIEWER only, on assigned applications.
  // ADMIN cannot approve/reject.
  // ──────────────────────────────────────────────────────────────

  describe('canReview()', () => {
    const app = fakeApp({ assignedTo: 'reviewer-user' });

    it('REVIEWER assigned → true', () => {
      loginAs(Role.Reviewer, 'reviewer-user');
      expect(permission.canReview(app)).toBe(true);
    });

    it('REVIEWER not assigned → false', () => {
      loginAs(Role.Reviewer, 'other-reviewer');
      expect(permission.canReview(app)).toBe(false);
    });

    it('SALES → false', () => {
      loginAs(Role.Sales);
      expect(permission.canReview(app)).toBe(false);
    });

    it('ADMIN → false (DECISIONS.md §3)', () => {
      loginAs(Role.Admin);
      expect(permission.canReview(app)).toBe(false);
    });

    it('logged out → false', () => {
      expect(permission.canReview(app)).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // canReveal(app)
  // DECISIONS.md §4: REVIEWER (assigned) and ADMIN; SALES never.
  // ──────────────────────────────────────────────────────────────

  describe('canReveal()', () => {
    const app = fakeApp({ assignedTo: 'reviewer-user' });

    it('REVIEWER assigned → true', () => {
      loginAs(Role.Reviewer, 'reviewer-user');
      expect(permission.canReveal(app)).toBe(true);
    });

    it('REVIEWER not assigned → false', () => {
      loginAs(Role.Reviewer, 'other-reviewer');
      expect(permission.canReveal(app)).toBe(false);
    });

    it('ADMIN → true for any application', () => {
      loginAs(Role.Admin);
      expect(permission.canReveal(app)).toBe(true);
    });

    it('SALES → false (DECISIONS.md §4)', () => {
      loginAs(Role.Sales);
      expect(permission.canReveal(app)).toBe(false);
    });

    it('logged out → false', () => {
      expect(permission.canReveal(app)).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // canManageAssignments()
  // DECISIONS.md §5 / Brief §2: ADMIN only.
  // ──────────────────────────────────────────────────────────────

  describe('canManageAssignments()', () => {
    it('ADMIN → true', () => {
      loginAs(Role.Admin);
      expect(permission.canManageAssignments()).toBe(true);
    });

    it('SALES → false', () => {
      loginAs(Role.Sales);
      expect(permission.canManageAssignments()).toBe(false);
    });

    it('REVIEWER → false', () => {
      loginAs(Role.Reviewer);
      expect(permission.canManageAssignments()).toBe(false);
    });

    it('logged out → false', () => {
      expect(permission.canManageAssignments()).toBe(false);
    });
  });
});
