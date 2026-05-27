import { Routes } from '@angular/router';
import { roleGuard } from '../../guards/role.guard';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: {
      roles: ['ADMINISTRATIVO', 'COORDINADOR']
    },
    loadComponent: () =>
      import('./pages/usuarios-page/usuarios-page.component').then(m => m.UsuariosPageComponent)
  },
  {
    path: 'crear-administrativo',
    canActivate: [roleGuard],
    data: {
      roles: ['COORDINADOR']
    },
    loadComponent: () =>
      import('./pages/crear-administrativo/crear-administrativo.component').then(m => m.CrearAdministrativoComponent)
  }
];
