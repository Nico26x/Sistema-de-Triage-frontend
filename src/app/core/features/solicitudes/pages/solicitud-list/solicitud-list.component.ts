import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout } from 'rxjs';
import { CanalOrigen, EstadoSolicitud, Prioridad, TipoSolicitudNombre } from '../../../../models/enums.models';
import { SolicitudFiltros, SolicitudResponse } from '../../../../models/solicitud.models';
import { SolicitudService } from '../../../../services/solicitud.service';
import { AlertService } from '../../../../services/alert.service';

@Component({
  standalone: true,
  selector: 'app-solicitud-list',
  templateUrl: './solicitud-list.component.html',
  styleUrls: ['./solicitud-list.component.css'],
  imports: [CommonModule, FormsModule]
})
export class SolicitudListComponent implements OnInit {
  private solicitudService = inject(SolicitudService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private alertService = inject(AlertService);

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
    console.log('[SolicitudList] ngOnInit');
    this.cargarSolicitudes();
  }

  cargarSolicitudes(filtros?: SolicitudFiltros): void {
    console.log('[SolicitudList] cargarSolicitudes:start');
    this.loading = true;
    this.error = '';

    this.solicitudService
      .getMisSolicitudes(filtros)
      .pipe(
        timeout(15000),
        finalize(() => {
          console.log('[SolicitudList] cargarSolicitudes:finalize');
          console.log('[SolicitudList] finalize antes', this.loading);
          this.loading = false;
          console.log('[SolicitudList] finalize despues', this.loading);
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          console.log('[SolicitudList] cargarSolicitudes:next', response);
          if (!Array.isArray(response)) {
            this.solicitudes = [];
            this.error = 'La respuesta del servidor no tiene el formato esperado para solicitudes.';
            this.alertService.error(
              'Error en la respuesta',
              'El servidor devolvió un formato inesperado. Por favor intenta nuevamente.'
            );
            return;
          }

          this.solicitudes = response.map(solicitud => ({
            ...solicitud,
            fechaRegistro: this.normalizarFechaIsoOpcional(solicitud.fechaRegistro),
            fechaLimite: this.normalizarFechaIsoNullable(solicitud.fechaLimite),
          }));
          
          this.cdr.detectChanges();
        },
        error: error => {
          console.error('[SolicitudList] cargarSolicitudes:error', error);
          this.solicitudes = [];
          this.error = this.obtenerMensajeError(error);
          this.mostrarErrorAlert(error);
        }
      });
  }

  actualizar(): void {
    if (this.hayFiltrosActivos()) {
      this.aplicarFiltros();
      return;
    }

    this.filtrosAplicados = false;
    this.cargarSolicitudes();
    this.alertService.toast('info', 'Actualizando solicitudes...');
  }

  aplicarFiltros(): void {
    this.error = '';

    if (this.fechasInvalidas()) {
      this.error = 'La fecha desde no puede ser mayor que la fecha hasta.';
      this.alertService.toast('error', 'Las fechas son inválidas. Verifica los rangos.');
      this.cdr.detectChanges();
      return;
    }

    const filtrosApi = this.construirFiltrosParaApi();
    this.filtrosAplicados = this.hayFiltrosActivos();
    
    if (this.filtrosAplicados) {
      this.alertService.toast('info', 'Aplicando filtros...');
    }
    
    this.cargarSolicitudes(filtrosApi);
  }

  limpiarFiltros(): void {
    this.filtros = {
      estado: '',
      prioridad: '',
      tipoSolicitud: '',
      canalOrigen: '',
      desde: '',
      hasta: ''
    };
    this.filtrosAplicados = false;
    this.error = '';
    this.cargarSolicitudes();
    this.alertService.toast('success', 'Filtros limpios');
    this.cdr.detectChanges();
  }

  volver(): void {
    this.router.navigate(['/dashboard']);
  }

  verDetalle(id: number): void {
    this.alertService.toast('info', `Cargando solicitud #${id}...`);
    setTimeout(() => {
      this.router.navigate(['/dashboard/solicitudes/detalle', id]);
    }, 500);
  }

  resumenDescripcion(descripcion?: string): string {
    if (!descripcion) return 'Sin descripcion';
    return descripcion.length > 120 ? `${descripcion.slice(0, 120)}...` : descripcion;
  }

  trackBySolicitudId(index: number, solicitud: SolicitudResponse): number {
    return solicitud.id ?? index;
  }

  private normalizarFechaIsoOpcional(fecha?: string): string | undefined {
    if (!fecha) return fecha;
    // Angular DatePipe falla con algunos ISO con precision > milisegundos.
    const normalizada = fecha.replace(/(\.\d{3})\d+/, '$1');
    const timestamp = Date.parse(normalizada);
    return Number.isNaN(timestamp) ? undefined : normalizada;
  }

  private normalizarFechaIsoNullable(fecha?: string | null): string | null | undefined {
    if (!fecha) return fecha;
    // Angular DatePipe falla con algunos ISO con precision > milisegundos.
    const normalizada = fecha.replace(/(\.\d{3})\d+/, '$1');
    const timestamp = Date.parse(normalizada);
    return Number.isNaN(timestamp) ? null : normalizada;
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible cargar tus solicitudes. Intenta nuevamente.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el backend. Verifica que el servidor este encendido.';
    }

    if (error.status === 401 || error.status === 403) {
      return 'Tu sesion expiro o no tienes permisos. Inicia sesion nuevamente.';
    }

    if (error.status >= 500) {
      return 'El servidor tuvo un problema al consultar tus solicitudes.';
    }

    return 'No fue posible cargar tus solicitudes. Intenta nuevamente.';
  }

  private mostrarErrorAlert(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.alertService.error(
        'Error al cargar solicitudes',
        'No fue posible cargar tus solicitudes. Intenta nuevamente.'
      );
      return;
    }

    if (error.status === 0) {
      this.alertService.error(
        'Sin conexión',
        'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      );
      return;
    }

    if (error.status === 401 || error.status === 403) {
      this.alertService.error(
        'Sesión expirada',
        'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
      );
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 2000);
      return;
    }

    if (error.status >= 500) {
      this.alertService.error(
        'Error del servidor',
        'El servidor está experimentando problemas. Por favor intenta más tarde.'
      );
      return;
    }

    this.alertService.error(
      'Error al cargar solicitudes',
      'Ocurrió un error inesperado. Por favor intenta nuevamente.'
    );
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

  private fechasInvalidas(): boolean {
    if (!this.filtros.desde || !this.filtros.hasta) {
      return false;
    }

    return this.filtros.desde > this.filtros.hasta;
  }
}