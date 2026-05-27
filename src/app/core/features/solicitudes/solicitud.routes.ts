import { Routes } from '@angular/router';
import { MainLayoutComponent } from '../../layout/main-layout/main-layout.component';

export const SOLICITUDES_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/solicitudes-hub/solicitudes-hub.component').then(m => m.SolicitudesHubComponent)
      },
      // ESTUDIANTE Routes
      {
        path: 'crear',
        loadComponent: () => import('./pages/solicitud-create/solicitud-create.component').then(m => m.SolicitudCreateComponent)
      },
      {
        path: 'mis-solicitudes',
        loadComponent: () => import('./pages/solicitud-list/solicitud-list.component').then(m => m.SolicitudListComponent)
      },
      // ADMINISTRATIVO Routes
      {
        path: 'pendientes',
        loadComponent: () => import('./pages/placeholder/solicitud-placeholder.component').then(m => m.SolicitudPlaceholderComponent)
      },
      {
        path: 'gestion',
        loadComponent: () => import('./pages/placeholder/solicitud-placeholder.component').then(m => m.SolicitudPlaceholderComponent)
      },
      {
        path: 'cambiar-estado',
        loadComponent: () => import('./pages/placeholder/solicitud-placeholder.component').then(m => m.SolicitudPlaceholderComponent)
      },
      {
        path: 'prioridades',
        loadComponent: () => import('./pages/placeholder/solicitud-placeholder.component').then(m => m.SolicitudPlaceholderComponent)
      },
      {
        path: 'historial',
        loadComponent: () => import('./pages/placeholder/solicitud-placeholder.component').then(m => m.SolicitudPlaceholderComponent)
      },
      // COORDINADOR Routes
      {
        path: 'gestion-general',
        loadComponent: () => import('./pages/placeholder/solicitud-placeholder.component').then(m => m.SolicitudPlaceholderComponent)
      },
      {
        path: 'estadisticas',
        loadComponent: () => import('./pages/placeholder/solicitud-placeholder.component').then(m => m.SolicitudPlaceholderComponent)
      },
      {
        path: 'supervision',
        loadComponent: () => import('./pages/placeholder/solicitud-placeholder.component').then(m => m.SolicitudPlaceholderComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/placeholder/solicitud-placeholder.component').then(m => m.SolicitudPlaceholderComponent)
      },
      {
        path: 'administracion',
        loadComponent: () => import('./pages/placeholder/solicitud-placeholder.component').then(m => m.SolicitudPlaceholderComponent)
      }
    ]
  }
];
