import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { SolicitudService } from '../../../../services/solicitud.service';
import { TokenService } from '../../../../services/token.service';
import { AlertService } from '../../../../services/alert.service';
import { RolNombre } from '../../../../models/auth.models';
import { SolicitudResponse } from '../../../../models/solicitud.models';

interface TipoDistribucion {
  nombre: string;
  count: number;
  porcentaje: number;
}

@Component({
  standalone: true,
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css'],
  imports: [CommonModule]
})
export class DashboardHomeComponent implements OnInit {
  userRole: RolNombre | null = null;
  userEmail: string | null = null;
  solicitudes: SolicitudResponse[] = [];
  misSolicitudesCount = 0;
  registradasCount = 0;
  enAtencionCount = 0;
  atendidasCount = 0;
  cerradasCount = 0;
  criticasCount = 0;
  totalCount = 0;
  atendidasHoyCount = 0;
  loadingSolicitudes = false;

  // Distribución por tipo
  tiposDistribucion: TipoDistribucion[] = [
    { nombre: 'Homologación', count: 0, porcentaje: 0 },
    { nombre: 'Solicitud cupo', count: 0, porcentaje: 0 },
    { nombre: 'Cancelación', count: 0, porcentaje: 0 },
    { nombre: 'Registro asig.', count: 0, porcentaje: 0 },
    { nombre: 'Consulta', count: 0, porcentaje: 0 }
  ];

  constructor(
    private authService: AuthService,
    private solicitudService: SolicitudService,
    private tokenService: TokenService,
    private alertService: AlertService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getCurrentRole();
    this.userEmail = this.tokenService.getEmail();
    this.cargarSolicitudesDashboard();
  }

  isStudentRole(): boolean {
    return this.userRole === 'ESTUDIANTE';
  }

  isAdminRole(): boolean {
    return this.userRole === 'ADMINISTRATIVO';
  }

  isCoordinatorRole(): boolean {
    return this.userRole === 'COORDINADOR';
  }

  goToSolicitudes(): void {
    this.router.navigate(['/dashboard/solicitudes']);
  }

  goToUsuarios(): void {
    this.router.navigate(['/dashboard/usuarios']);
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  cargarSolicitudesDashboard(): void {
    this.loadingSolicitudes = true;
    this.solicitudes = [];
    this.actualizarContadores();
    this.resetearDistribucion();

    // Usa el rol que ya se asignó en ngOnInit
    const solicitudes$ = this.isStudentRole()
      ? this.solicitudService.getMisSolicitudes()
      : this.solicitudService.listarSolicitudes();

    solicitudes$
      .pipe(
        finalize(() => {
          this.loadingSolicitudes = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          this.solicitudes = this.normalizarRespuestaSolicitudes(response);
          this.actualizarContadores();
          this.actualizarDistribucionPorTipo();
          console.log('[DashboardHome] Solicitudes cargadas:', this.solicitudes.length);
          this.cdr.detectChanges();
        },
        error: error => {
          console.error('[DashboardHome] cargarSolicitudesDashboard:error', error);
          this.solicitudes = [];
          this.actualizarContadores();
          this.resetearDistribucion();
          this.alertService.error(
            'Error al cargar solicitudes',
            'No se pudieron cargar las solicitudes del dashboard'
          );
          this.cdr.detectChanges();
        }
      });
  }

  private normalizarRespuestaSolicitudes(response: unknown): SolicitudResponse[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (response && typeof response === 'object') {
      const maybeResponse = response as Record<string, unknown>;
      if (Array.isArray(maybeResponse['data'])) {
        return maybeResponse['data'] as SolicitudResponse[];
      }
      if (Array.isArray(maybeResponse['result'])) {
        return maybeResponse['result'] as SolicitudResponse[];
      }
    }

    return [];
  }

  private actualizarContadores(): void {
    const solicitudes = this.solicitudes ?? [];
    
    this.totalCount = solicitudes.length;
    this.misSolicitudesCount = solicitudes.length;
    this.registradasCount = solicitudes.filter(s => this.obtenerEstado(s) === 'REGISTRADA').length;
    this.enAtencionCount = solicitudes.filter(s => this.obtenerEstado(s) === 'EN_ATENCION').length;
    this.atendidasCount = solicitudes.filter(s => this.obtenerEstado(s) === 'ATENDIDA').length;
    this.cerradasCount = solicitudes.filter(s => this.obtenerEstado(s) === 'CERRADA').length;
    this.criticasCount = solicitudes.filter(s => s.prioridad === 'CRITICA').length;
    this.atendidasHoyCount = this.atendidasCount;

    console.log('[DashboardHome] Contadores actualizados:', {
      total: this.totalCount,
      registradas: this.registradasCount,
      enAtencion: this.enAtencionCount,
      atendidas: this.atendidasCount,
      cerradas: this.cerradasCount,
      criticas: this.criticasCount
    });

    this.cdr.detectChanges();
  }

  private actualizarDistribucionPorTipo(): void {
    const solicitudes = this.solicitudes ?? [];
    const total = solicitudes.length;

    // Mapeo de tipos de solicitud
    const tipoMap: { [key: string]: string } = {
      'HOMOLOGACION': 'Homologación',
      'SOLICITUD_CUPO': 'Solicitud cupo',
      'CANCELACION_ASIGNATURA': 'Cancelación',
      'REGISTRO_ASIGNATURA': 'Registro asig.',
      'CONSULTA_ACADEMICA': 'Consulta'
    };

    // Contar cada tipo
    const conteos: { [key: string]: number } = {};
    
    solicitudes.forEach(solicitud => {
      const tipo = solicitud.tipoSolicitud;
      if (tipo) {
        conteos[tipo] = (conteos[tipo] || 0) + 1;
      }
    });

    // Actualizar distribución
    this.tiposDistribucion = this.tiposDistribucion.map(tipo => {
      // Buscar el conteo para este tipo
      let count = 0;
      
      for (const [tipoKey, tipoNombre] of Object.entries(tipoMap)) {
        if (tipoNombre === tipo.nombre && conteos[tipoKey]) {
          count = conteos[tipoKey];
          break;
        }
      }

      const porcentaje = total > 0 ? Math.round((count / total) * 100) : 0;

      return {
        nombre: tipo.nombre,
        count,
        porcentaje
      };
    });

    console.log('[DashboardHome] Distribución por tipo:', this.tiposDistribucion);
    this.cdr.detectChanges();
  }

  private resetearDistribucion(): void {
    this.tiposDistribucion = [
      { nombre: 'Homologación', count: 0, porcentaje: 0 },
      { nombre: 'Solicitud cupo', count: 0, porcentaje: 0 },
      { nombre: 'Cancelación', count: 0, porcentaje: 0 },
      { nombre: 'Registro asig.', count: 0, porcentaje: 0 },
      { nombre: 'Consulta', count: 0, porcentaje: 0 }
    ];
  }

  private obtenerEstado(solicitud: SolicitudResponse): string | undefined {
    return solicitud.estado ?? solicitud.estadoActual;
  }
}