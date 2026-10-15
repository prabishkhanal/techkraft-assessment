/** Lifecycle statuses an application moves through. */
export enum ApplicationStatus {
  Draft = 'DRAFT',
  Submitted = 'SUBMITTED',
  UnderReview = 'UNDER_REVIEW',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
}

/**
 * A merchant application record.
 *
 * Sensitive fields (taxId, bankAccountNumber) are always present in the
 * payload but the UI must mask them by default and only reveal when the
 * current role has permission (see PermissionService.canReveal).
 */
export interface Application {
  id: string;
  /** The SALES user who created this application. */
  createdBy: string;
  /** Username of the REVIEWER assigned by an ADMIN (null if unassigned). */
  assignedTo: string | null;

  /** Current lifecycle status. */
  status: ApplicationStatus;

  // --- Step 1: Business info ---
  businessName: string;
  businessType: string;
  registrationNumber: string;

  // --- Step 2: Contact info ---
  contactName: string;
  contactEmail: string;
  contactPhone: string;

  // --- Step 3: Financial / sensitive info ---
  /** Sensitive — masked by default. */
  taxId: string;
  /** Sensitive — masked by default. */
  bankAccountNumber: string;
  estimatedMonthlyVolume: number;

  /** ISO-8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}
