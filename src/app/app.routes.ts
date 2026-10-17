import { Routes, UrlSegment } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';
import { Role } from './core/models';

// One route configuration lets Angular retain the live form and save queue when
// the first successful save changes /create to /:id/edit.
function wizardMatcher(segments: UrlSegment[]) {
  if (segments[0]?.path !== 'applications') return null;
  if (segments.length === 2 && segments[1].path === 'create') {
    return { consumed: segments };
  }
  if (segments.length === 3 && segments[2].path === 'edit') {
    return { consumed: segments, posParams: { id: segments[1] } };
  }
  return null;
}

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page/dashboard-page').then((m) => m.DashboardPage),
      },
      {
        path: 'applications/new',
        pathMatch: 'full',
        redirectTo: 'applications/create',
      },
      {
        matcher: wizardMatcher,
        canActivate: [roleGuard],
        runGuardsAndResolvers: 'always',
        data: { roles: [Role.Sales] },
        loadComponent: () =>
          import('./features/application-wizard/wizard-container/wizard-container').then(
            (m) => m.WizardContainer,
          ),
        canDeactivate: [
          (
            component: { canLeave: () => boolean; application: () => { id: string } | null },
            _route,
            current,
            next,
          ) => {
            const id = component.application()?.id;
            return (
              (current.url === '/applications/create' &&
                next?.url === `/applications/${id}/edit`) ||
              component.canLeave()
            );
          },
        ],
      },
      {
        path: 'applications/:id',
        loadComponent: () =>
          import('./features/application-detail/detail-page/detail-page').then((m) => m.DetailPage),
      },
      {
        path: 'assignments',
        canActivate: [roleGuard],
        data: { roles: [Role.Admin] },
        loadComponent: () =>
          import('./features/admin/assignments-page/assignments-page').then(
            (m) => m.AssignmentsPage,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
