import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/usuarios-page/usuarios-page.component').then(m => m.UsuariosPageComponent)
  },
  {
    path: 'crear-administrativo',
    loadComponent: () =>
      import('./pages/crear-administrativo/crear-administrativo.component').then(m => m.CrearAdministrativoComponent)
  }
];
