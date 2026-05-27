import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { SolicitudService } from '../../../../services/solicitud.service';
import { SolicitudCreateRequest } from '../../../../models/solicitud.models';
import { CanalOrigen, ImpactoAcademico, TipoSolicitudNombre } from '../../../../models/enums.models';

@Component({
  standalone: true,
  selector: 'app-solicitud-create',
  templateUrl: './solicitud-create.component.html',
  imports: [CommonModule, FormsModule]
})
export class SolicitudCreateComponent {
  private solicitudService = inject(SolicitudService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  descripcion = '';
  canal: CanalOrigen | '' = '';
  impacto: ImpactoAcademico | '' = '';
  tipo: TipoSolicitudNombre | '' = '';
  fechaLimite = '';

  canales: CanalOrigen[] = ['CSU', 'CORREO', 'SAC', 'TELEFONICO', 'PRESENCIAL'];
  impactos: ImpactoAcademico[] = ['BAJO', 'MEDIO', 'ALTO', 'CRITICO'];
  tipos: TipoSolicitudNombre[] = [
    'HOMOLOGACION',
    'SOLICITUD_CUPO',
    'CANCELACION_ASIGNATURA',
    'REGISTRO_ASIGNATURA',
    'CONSULTA_ACADEMICA',
    'OTRO'
  ];

  loading = false;
  error = '';
  success = '';

  guardar(): void {
    if (this.loading) {
      return;
    }

    if (!this.descripcion.trim() || !this.canal || !this.impacto || !this.tipo) {
      this.error = 'Debes completar descripcion, canal, impacto y tipo.';
      this.success = '';
      this.cdr.detectChanges();
      return;
    }

    const errorFecha = this.validarFechaLimite(this.fechaLimite);
    if (errorFecha) {
      this.error = errorFecha;
      this.success = '';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const request = this.construirRequest();

    this.solicitudService
      .crearSolicitud(request)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.success = 'Solicitud creada correctamente.';
          this.error = '';
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.success = '';
          this.error = this.obtenerMensajeError(error);
          this.cdr.detectChanges();
        }
      });
  }

  volver(): void {
    this.router.navigate(['/dashboard/solicitudes']);
  }

  irAMisSolicitudes(): void {
    this.router.navigate(['/dashboard/solicitudes/mis-solicitudes']);
  }

  crearOtraSolicitud(): void {
    this.descripcion = '';
    this.canal = '';
    this.impacto = '';
    this.tipo = '';
    this.fechaLimite = '';
    this.error = '';
    this.success = '';
    this.loading = false;
    this.cdr.detectChanges();
  }

  private construirRequest(): SolicitudCreateRequest {
    return {
      descripcion: this.descripcion.trim(),
      canal: this.canal as CanalOrigen,
      solicitanteId: null,
      impacto: this.impacto as ImpactoAcademico,
      fechaLimite: this.normalizarFechaLimite(this.fechaLimite),
      tipo: this.tipo as TipoSolicitudNombre
    };
  }

  private normalizarFechaLimite(valor: string): string | null {
    if (!valor) {
      return null;
    }

    return valor.length === 16 ? `${valor}:00` : valor;
  }

  private validarFechaLimite(valor: string): string | null {
    if (!valor) {
      return null;
    }

    const normalizada = this.normalizarFechaLimite(valor);
    if (!normalizada) {
      return 'La fecha limite no es valida.';
    }

    const fecha = new Date(normalizada);
    if (Number.isNaN(fecha.getTime())) {
      return 'La fecha limite no es valida.';
    }

    if (fecha.getTime() < Date.now()) {
      return 'La fecha limite no puede ser anterior a la fecha actual.';
    }

    return null;
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible crear la solicitud. Intenta nuevamente.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el backend. Verifica que el servidor este encendido.';
    }

    if (error.status === 400) {
      return 'Los datos enviados no son validos. Revisa el formulario.';
    }

    if (error.status === 401 || error.status === 403) {
      return 'Tu sesion expiro o no tienes permisos. Inicia sesion nuevamente.';
    }

    if (error.status >= 500) {
      return 'El servidor tuvo un problema al crear la solicitud.';
    }

    return 'No fue posible crear la solicitud. Revisa los datos e intenta de nuevo.';
  }
}
