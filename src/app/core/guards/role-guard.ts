import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../auth/session';

export const roleGuard: CanActivateFn = (route, state) => {
  const role = inject(SessionService).role();
  return role && route.data['roles']?.includes(role)
    ? true
    : inject(Router).createUrlTree(['/dashboard']);
};
