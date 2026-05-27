import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout } from 'rxjs';
import { CanalOrigen, EstadoSolicitud, Prioridad, TipoSolicitudNombre } from '../../../../models/enums.models';
import { SolicitudFiltros, SolicitudResponse } from '../../../../models/solicitud.models';
import { SolicitudService } from '../../../../services/solicitud.service';

@Component({
  standalone: true,
  selector: 'app-solicitud-manage',
  templateUrl: './solicitud-manage.component.html',
  imports: [CommonModule, FormsModule]
})
export class SolicitudManageComponent implements OnInit {
  private solicitudService = inject(SolicitudService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  solicitudes: SolicitudResponse[] = [];
  loading = false;
  error = '';
  filtrosAplicados = false;

  filtros: SolicitudFiltros = {
    estado: '',
    prioridad: '',
    tipoSolicitud: '',
    canalOrigen: '',
    desde: '',
    hasta: ''
  };

  estados: EstadoSolicitud[] = ['REGISTRADA', 'CLASIFICADA', 'EN_ATENCION', 'ATENDIDA', 'CERRADA'];
  prioridades: Prioridad[] = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
  tipos: TipoSolicitudNombre[] = [
    'HOMOLOGACION',
    'SOLICITUD_CUPO',
    'CANCELACION_ASIGNATURA',
    'REGISTRO_ASIGNATURA',
    'CONSULTA_ACADEMICA',
    'OTRO'
  ];
  canales: CanalOrigen[] = ['CSU', 'CORREO', 'SAC', 'TELEFONICO', 'PRESENCIAL'];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const estado = params.get('estado');

      this.filtros = {
        estado: '',
        prioridad: '',
        tipoSolicitud: '',
        canalOrigen: '',
        desde: '',
        hasta: ''
      };

      if (this.esEstadoValido(estado)) {
        this.filtros.estado = estado;
      }

      this.filtrosAplicados = this.hayFiltrosActivos();
      const filtrosApi = this.construirFiltrosParaApi();
      this.cargarSolicitudes(filtrosApi);
      this.cdr.detectChanges();
    });
  }

  cargarSolicitudes(filtros?: SolicitudFiltros): void {
    this.loading = true;
    this.error = '';

    this.solicitudService
      .listarSolicitudes(filtros)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          this.solicitudes = Array.isArray(response) ? response : [];
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.solicitudes = [];
          this.error = this.obtenerMensajeError(error);
          this.cdr.detectChanges();
        }
      });
  }

  actualizar(): void {
    if (this.hayFiltrosActivos()) {
      const filtrosApi = this.construirFiltrosParaApi();
      this.filtrosAplicados = true;
      this.cargarSolicitudes(filtrosApi);
      return;
    }

    this.filtrosAplicados = false;
    this.cargarSolicitudes();
  }

  aplicarFiltros(): void {
    this.error = '';

    if (this.fechasInvalidas()) {
      this.error = 'La fecha desde no puede ser mayor que la fecha hasta.';
      this.cdr.detectChanges();
      return;
    }

    const filtrosApi = this.construirFiltrosParaApi();
    this.filtrosAplicados = this.hayFiltrosActivos();
    this.cargarSolicitudes(filtrosApi);
  }

  limpiarFiltros(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
    this.cdr.detectChanges();
  }

  verDetalle(id: number): void {
    this.router.navigate(['/dashboard/solicitudes/detalle', id]);
  }

  volverAlPanel(): void {
    this.router.navigate(['/dashboard/solicitudes']);
  }

  trackBySolicitudId(index: number, solicitud: SolicitudResponse): number {
    return solicitud.id ?? index;
  }

  private construirFiltrosParaApi(): SolicitudFiltros {
    const estado = this.filtros.estado?.trim() ?? '';
    const prioridad = this.filtros.prioridad?.trim() ?? '';
    const tipoSolicitud = this.filtros.tipoSolicitud?.trim() ?? '';
    const canalOrigen = this.filtros.canalOrigen?.trim() ?? '';
    const desde = this.normalizarFechaDesde(this.filtros.desde);
    const hasta = this.normalizarFechaHasta(this.filtros.hasta);

    return {
      ...(estado ? { estado: estado as EstadoSolicitud } : {}),
      ...(prioridad ? { prioridad: prioridad as Prioridad } : {}),
      ...(tipoSolicitud ? { tipoSolicitud: tipoSolicitud as TipoSolicitudNombre } : {}),
      ...(canalOrigen ? { canalOrigen: canalOrigen as CanalOrigen } : {}),
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {})
    };
  }

  private normalizarFechaDesde(fecha?: string): string | '' {
    if (!fecha?.trim()) {
      return '';
    }

    return `${fecha}T00:00:00`;
  }

  private normalizarFechaHasta(fecha?: string): string | '' {
    if (!fecha?.trim()) {
      return '';
    }

    return `${fecha}T23:59:59`;
  }

  private fechasInvalidas(): boolean {
    if (!this.filtros.desde || !this.filtros.hasta) {
      return false;
    }

    return this.filtros.desde > this.filtros.hasta;
  }

  private hayFiltrosActivos(): boolean {
    return Boolean(
      this.filtros.estado ||
      this.filtros.prioridad ||
      this.filtros.tipoSolicitud ||
      this.filtros.canalOrigen ||
      this.filtros.desde ||
      this.filtros.hasta
    );
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudieron cargar las solicitudes. Intenta nuevamente.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el backend. Verifica que el servidor este encendido.';
    }

    if (error.status === 401 || error.status === 403) {
      return 'Tu sesion expiro o no tienes permisos para consultar solicitudes.';
    }

    if (error.status >= 500) {
      return 'El servidor tuvo un problema al consultar solicitudes.';
    }

    return 'No se pudieron cargar las solicitudes. Intenta nuevamente.';
  }

  private esEstadoValido(estado: string | null): estado is EstadoSolicitud {
    return (
      estado === 'REGISTRADA' ||
      estado === 'CLASIFICADA' ||
      estado === 'EN_ATENCION' ||
      estado === 'ATENDIDA' ||
      estado === 'CERRADA'
    );
  }
}
