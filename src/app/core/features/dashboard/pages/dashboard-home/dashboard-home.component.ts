import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { SolicitudService } from '../../../../services/solicitud.service';
import { TokenService } from '../../../../services/token.service';
import { RolNombre } from '../../../../models/auth.models';
import { SolicitudResponse } from '../../../../models/solicitud.models';

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

  constructor(
    private authService: AuthService,
    private solicitudService: SolicitudService,
    private tokenService: TokenService,
    private router: Router
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

  // 👇 Usa el rol que ya se asignó en ngOnInit, no lo releas
  const solicitudes$ = this.isStudentRole()
    ? this.solicitudService.getMisSolicitudes()
    : this.solicitudService.listarSolicitudes();

  solicitudes$.subscribe({
    next: response => {
      this.solicitudes = this.normalizarRespuestaSolicitudes(response);
      this.actualizarContadores();
      this.loadingSolicitudes = false;
    },
    error: error => {
      console.error('[DashboardHome] cargarSolicitudesDashboard:error', error);
      this.solicitudes = [];
      this.actualizarContadores();
      this.loadingSolicitudes = false;
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
  }

  private obtenerEstado(solicitud: SolicitudResponse): string | undefined {
    return solicitud.estado ?? solicitud.estadoActual;
  }
}