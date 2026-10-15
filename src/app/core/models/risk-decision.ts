/** The outcome a REVIEWER records on an assigned application. */
export enum RiskDecision {
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
}

/** One entry in the risk history timeline shown on the application detail page. */
export interface RiskHistoryEntry {
  /** Unique id of this history record. */
  id: string;
  /** The application this decision belongs to. */
  applicationId: string;
  /** Username of the reviewer who recorded the decision. */
  reviewerUsername: string;
  /** What the reviewer decided. */
  decision: RiskDecision;
  /** Free-text note the reviewer attached to the decision. */
  comment: string;
  /** ISO-8601 timestamp when the decision was recorded. */
  createdAt: string;
}
