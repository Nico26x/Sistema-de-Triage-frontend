import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout } from 'rxjs';
import { SolicitudResponse } from '../../../../models/solicitud.models';
import { SolicitudService } from '../../../../services/solicitud.service';

@Component({
  standalone: true,
  selector: 'app-solicitud-list',
  templateUrl: './solicitud-list.component.html',
  styleUrls: ['./solicitud-list.component.css'],
  imports: [CommonModule]
})
export class SolicitudListComponent implements OnInit {
  private solicitudService = inject(SolicitudService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  solicitudes: SolicitudResponse[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    console.log('[SolicitudList] ngOnInit');
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    console.log('[SolicitudList] cargarSolicitudes:start');
    this.loading = true;
    this.error = '';

    this.solicitudService
      .getMisSolicitudes()
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
        }
      });
  }

  actualizar(): void {
    this.cargarSolicitudes();
  }

  volver(): void {
    this.router.navigate(['/dashboard/solicitudes']);
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
}
