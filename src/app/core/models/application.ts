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
 * List and detail responses contain masked tax/account values. A separate,
 * authorized endpoint returns raw values for a short-lived reveal.
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
