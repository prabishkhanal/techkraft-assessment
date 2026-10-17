import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../auth/session';

export const authGuard: CanActivateFn = (route, state) => {
  return inject(SessionService).user() ? true : inject(Router).createUrlTree(['/login']);
};
