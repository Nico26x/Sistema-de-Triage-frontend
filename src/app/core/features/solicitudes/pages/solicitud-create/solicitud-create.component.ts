import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { SolicitudService } from '../../../../services/solicitud.service';
import { AlertService } from '../../../../services/alert.service';
import { SolicitudCreateRequest, SugerenciaClasificacionRequest, SugerenciaClasificacionResponse } from '../../../../models/solicitud.models';
import { CanalOrigen, ImpactoAcademico, TipoSolicitudNombre } from '../../../../models/enums.models';

@Component({
  standalone: true,
  selector: 'app-solicitud-create',
  templateUrl: './solicitud-create.component.html',
  styleUrls: ['./solicitud-create.component.css'],
  imports: [CommonModule, FormsModule]
})
export class SolicitudCreateComponent {
  private solicitudService = inject(SolicitudService);
  private alertService = inject(AlertService);
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
  loadingIa = false;
  error = '';
  errorIa = '';
  success = '';
  sugerenciaIa: SugerenciaClasificacionResponse | null = null;

  guardar(): void {
    if (this.loading) {
      return;
    }

    if (!this.descripcion.trim() || !this.canal || !this.impacto || !this.tipo) {
      this.error = 'Debes completar descripción, canal, impacto y tipo.';
      this.success = '';
      this.alertService.toast('warning', this.error);
      this.cdr.detectChanges();
      return;
    }

    const errorFecha = this.validarFechaLimite(this.fechaLimite);
    if (errorFecha) {
      this.error = errorFecha;
      this.success = '';
      this.alertService.toast('warning', errorFecha);
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
          this.alertService.toast('success', this.success);
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.success = '';
          this.error = this.obtenerMensajeError(error);
          this.alertService.toast('error', this.error);
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

  sugerirClasificacion(): void {
    if (this.loadingIa) {
      return;
    }

    this.errorIa = '';
    const requestIa = this.construirRequestIa();

    if (!requestIa) {
      this.cdr.detectChanges();
      return;
    }

    this.loadingIa = true;
    this.errorIa = '';
    this.sugerenciaIa = null;

    this.solicitudService
      .sugerirClasificacion(requestIa)
      .pipe(
        finalize(() => {
          this.loadingIa = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          this.sugerenciaIa = response;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.errorIa = this.obtenerMensajeErrorIa(error);
          this.sugerenciaIa = null;
          this.cdr.detectChanges();
        }
      });
  }

  aceptarSugerenciaIa(): void {
    if (!this.sugerenciaIa) {
      this.errorIa = 'La IA no devolvio datos aplicables para completar el formulario.';
      this.cdr.detectChanges();
      return;
    }

    let aplicoSugerencia = false;

    if (this.sugerenciaIa.tipoSugerido) {
      this.tipo = this.sugerenciaIa.tipoSugerido;
      aplicoSugerencia = true;
    }

    if (this.sugerenciaIa.impactoSugerido) {
      this.impacto = this.sugerenciaIa.impactoSugerido;
      aplicoSugerencia = true;
    }

    if (this.sugerenciaIa.canalSugerido) {
      this.canal = this.sugerenciaIa.canalSugerido;
      aplicoSugerencia = true;
    }

    if (!aplicoSugerencia) {
      this.errorIa = 'La IA no devolvio datos aplicables para completar el formulario.';
      this.cdr.detectChanges();
      return;
    }

    this.errorIa = '';
    this.cdr.detectChanges();
  }

  limpiarSugerenciaIa(): void {
    this.sugerenciaIa = null;
    this.errorIa = '';
    this.loadingIa = false;
    this.cdr.detectChanges();
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

  private construirRequestIa(): SugerenciaClasificacionRequest | null {
    if (!this.descripcion.trim()) {
      this.errorIa = 'La descripcion es obligatoria para generar una sugerencia.';
      return null;
    }

    return {
      descripcion: this.descripcion.trim()
    };
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

  private obtenerMensajeErrorIa(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible obtener la sugerencia de clasificacion.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el backend.';
    }

    if (error.status === 400) {
      return 'Los datos para la sugerencia no son validos. Revisa la descripcion, canal, impacto y fecha.';
    }

    if (error.status === 401 || error.status === 403) {
      return 'Tu sesion expiro o no tienes permisos para usar la sugerencia de IA.';
    }

    if (error.status >= 500) {
      return 'El servidor tuvo un problema al generar la sugerencia.';
    }

    return 'No fue posible obtener la sugerencia de clasificacion.';
  }
}
