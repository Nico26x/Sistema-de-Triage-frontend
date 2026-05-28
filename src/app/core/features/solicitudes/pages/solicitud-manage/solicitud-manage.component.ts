import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout } from 'rxjs';
import { CanalOrigen, EstadoSolicitud, Prioridad, TipoSolicitudNombre } from '../../../../models/enums.models';
import { SolicitudFiltros, SolicitudResponse } from '../../../../models/solicitud.models';
import { UsuarioResponse } from '../../../../models/usuario.models';
import { SolicitudService } from '../../../../services/solicitud.service';
import { UsuarioService } from '../../../../services/usuario.service';
import { AlertService } from '../../../../services/alert.service'; // ← importar

@Component({
  standalone: true,
  selector: 'app-solicitud-manage',
  templateUrl: './solicitud-manage.component.html',
  styleUrls: ['./solicitud-manage.component.css'],
  imports: [CommonModule, FormsModule]
})
export class SolicitudManageComponent implements OnInit {
  private solicitudService = inject(SolicitudService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private alert = inject(AlertService); // ← inyectar

  solicitudes: SolicitudResponse[] = [];
  responsables: UsuarioResponse[] = [];
  responsablesFiltrados: UsuarioResponse[] = [];
  loading = false;
  error = '';
  filtrosAplicados = false;

  filtros: SolicitudFiltros = {
    estado: '',
    prioridad: '',
    tipoSolicitud: '',
    canalOrigen: '',
    responsableId: '',
    desde: '',
    hasta: ''
  };

  estados: EstadoSolicitud[] = ['REGISTRADA', 'CLASIFICADA', 'EN_ATENCION', 'ATENDIDA', 'CERRADA'];
  prioridades: Prioridad[] = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
  tipos: TipoSolicitudNombre[] = [
    'HOMOLOGACION', 'SOLICITUD_CUPO', 'CANCELACION_ASIGNATURA',
    'REGISTRO_ASIGNATURA', 'CONSULTA_ACADEMICA', 'OTRO'
  ];
  canales: CanalOrigen[] = ['CSU', 'CORREO', 'SAC', 'TELEFONICO', 'PRESENCIAL'];

  ngOnInit(): void {
    this.cargarResponsables();

    this.route.queryParamMap.subscribe(params => {
      const estado = params.get('estado');
      const responsableId = params.get('responsableId');

      this.filtros = {
        estado: '', prioridad: '', tipoSolicitud: '',
        canalOrigen: '', responsableId: '', desde: '', hasta: ''
      };

      if (this.esEstadoValido(estado)) this.filtros.estado = estado;
      if (responsableId?.trim()) this.filtros.responsableId = responsableId;

      this.filtrosAplicados = this.hayFiltrosActivos();
      this.cargarSolicitudes(this.construirFiltrosParaApi());
      this.cdr.detectChanges();
    });
  }

  cargarResponsables(): void {
    this.usuarioService.listarResponsables().subscribe({
      next: responsables => {
        this.responsables = Array.isArray(responsables) ? responsables : [];
        this.responsablesFiltrados = this.responsables.filter(
          u => u.activo === true && (u.rol === 'ADMINISTRATIVO' || u.rol === 'COORDINADOR')
        );
        this.cdr.detectChanges();
      },
      error: () => {
        this.responsables = [];
        this.responsablesFiltrados = [];
        // Toast suave — no bloquea al usuario
        this.alert.toast('warning', 'No se pudieron cargar los responsables.');
        this.cdr.detectChanges();
      }
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

          // Toast de confirmación solo si hay resultados y había filtros activos
          if (this.filtrosAplicados && this.solicitudes.length > 0) {
            this.alert.toast('success', `${this.solicitudes.length} solicitudes encontradas.`);
          }

          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.solicitudes = [];
          const mensaje = this.obtenerMensajeError(error);
          this.error = mensaje;
          this.alert.error('Error al cargar solicitudes', mensaje); // ← modal de error
          this.cdr.detectChanges();
        }
      });
  }

  actualizar(): void {
    if (this.hayFiltrosActivos()) {
      this.filtrosAplicados = true;
      this.cargarSolicitudes(this.construirFiltrosParaApi());
      return;
    }
    this.filtrosAplicados = false;
    this.cargarSolicitudes();
  }

aplicarFiltros(): void {
  this.error = '';

  if (this.fechasInvalidas()) {
    this.alert.warning(
      'Fechas inválidas',
      'La fecha "Desde" no puede ser mayor que la fecha "Hasta".'
    );
    return;
  }

  this.filtrosAplicados = this.hayFiltrosActivos();
  this.cargarSolicitudes(this.construirFiltrosParaApi());
  this.alert.toast('success', 'Filtros aplicados.'); // ← igual que limpiar
}

  limpiarFiltros(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    this.alert.toast('info', 'Filtros eliminados.');
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

  // ===== Helpers privados (sin cambios) =====

  private construirFiltrosParaApi(): SolicitudFiltros {
    const { estado, prioridad, tipoSolicitud, canalOrigen, responsableId, desde, hasta } = this.filtros;
    return {
      ...(estado?.trim() ? { estado: estado as EstadoSolicitud } : {}),
      ...(prioridad?.trim() ? { prioridad: prioridad as Prioridad } : {}),
      ...(tipoSolicitud?.trim() ? { tipoSolicitud: tipoSolicitud as TipoSolicitudNombre } : {}),
      ...(canalOrigen?.trim() ? { canalOrigen: canalOrigen as CanalOrigen } : {}),
      ...(responsableId ? { responsableId } : {}),
      ...(desde?.trim() ? { desde: `${desde}T00:00:00` } : {}),
      ...(hasta?.trim() ? { hasta: `${hasta}T23:59:59` } : {}),
    };
  }

  private fechasInvalidas(): boolean {
    if (!this.filtros.desde || !this.filtros.hasta) return false;
    return this.filtros.desde > this.filtros.hasta;
  }

  private hayFiltrosActivos(): boolean {
    return Boolean(
      this.filtros.estado || this.filtros.prioridad || this.filtros.tipoSolicitud ||
      this.filtros.canalOrigen || this.filtros.responsableId ||
      this.filtros.desde || this.filtros.hasta
    );
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) return 'No se pudieron cargar las solicitudes. Intenta nuevamente.';
    if (error.status === 0) return 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.';
    if (error.status === 401 || error.status === 403) return 'Tu sesión expiró o no tienes permisos para consultar solicitudes.';
    if (error.status >= 500) return 'El servidor tuvo un problema al consultar solicitudes.';
    return 'No se pudieron cargar las solicitudes. Intenta nuevamente.';
  }

  private esEstadoValido(estado: string | null): estado is EstadoSolicitud {
    return ['REGISTRADA', 'CLASIFICADA', 'EN_ATENCION', 'ATENDIDA', 'CERRADA'].includes(estado ?? '');
  }

  // Usado en el HTML para colorear fechas vencidas
  esFechaVencida(fecha: string | null | undefined): boolean {
    if (!fecha) return false;
    return new Date(fecha) < new Date();
  }
}