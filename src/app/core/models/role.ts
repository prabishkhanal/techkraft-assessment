/**
 * The three user roles defined in the assignment brief.
 * SALES  — creates/edits merchant applications, views permitted applications.
 * REVIEWER — reviews assigned applications, records risk decisions.
 * ADMIN — views all applications, manages reviewer assignments.
 */
export enum Role {
  Sales = 'SALES',
  Reviewer = 'REVIEWER',
  Admin = 'ADMIN',
}
