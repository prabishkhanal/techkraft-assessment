/**
 * Generic wrapper for server-side paginated responses.
 * The mock API returns this shape for every list endpoint.
 */
export interface PageResult<T> {
  /** The slice of rows for the current page. */
  data: T[];
  /** Total number of rows matching the current filter (across all pages). */
  total: number;
  /** The 1-based page number that was returned. */
  page: number;
  /** How many rows per page the server used. */
  pageSize: number;
}
