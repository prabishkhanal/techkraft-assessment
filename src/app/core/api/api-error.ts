import { HttpErrorResponse } from '@angular/common/http';

export function apiError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0 || error.status === 504)
      return 'Cannot reach the API. Check that npm run dev is running, then retry.';
    return error.error?.message || `Request failed (${error.status}). Please retry.`;
  }
  return 'Something went wrong. Please retry.';
}
