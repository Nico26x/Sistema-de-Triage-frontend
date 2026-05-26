import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./core/features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./core/features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: 'dashboard/solicitudes',
    canActivate: [authGuard],
    loadChildren: () => import('./core/features/solicitudes/solicitud.routes').then(m => m.SOLICITUDES_ROUTES)
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./core/features/forbidden/forbidden/forbidden.component').then(m => m.ForbiddenComponent)
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
