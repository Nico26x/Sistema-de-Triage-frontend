import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { SolicitudService } from '../../../../services/solicitud.service';
import { AuthService } from '../../../../services/auth.service';
import { ImpactoAcademico, TipoSolicitudNombre } from '../../../../models/enums.models';
import { ClasificarSolicitudRequest, SolicitudHistorialResponse, SolicitudResponse } from '../../../../models/solicitud.models';

@Component({
  standalone: true,
  selector: 'app-solicitud-detail',
  templateUrl: './solicitud-detail.component.html',
  imports: [CommonModule, FormsModule]
})
export class SolicitudDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private solicitudService = inject(SolicitudService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  solicitud: SolicitudResponse | null = null;
  historial: SolicitudHistorialResponse[] = [];
  userRole: string | null = null;

  clasificacionForm = {
    tipoSolicitud: '' as TipoSolicitudNombre | '',
    impacto: '' as ImpactoAcademico | '',
    fechaLimite: '',
    observacion: ''
  };

  clasificando = false;
  errorClasificacion = '';
  exitoClasificacion = '';

  tiposClasificacion: TipoSolicitudNombre[] = [
    'HOMOLOGACION',
    'SOLICITUD_CUPO',
    'CANCELACION_ASIGNATURA',
    'REGISTRO_ASIGNATURA',
    'CONSULTA_ACADEMICA',
    'OTRO'
  ];

  impactosClasificacion: ImpactoAcademico[] = ['BAJO', 'MEDIO', 'ALTO', 'CRITICO'];

  loading = false;
  error = '';
  loadingHistorial = false;
  errorHistorial = '';
  private solicitudId: number | null = null;

  ngOnInit(): void {
    this.userRole = this.authService.getCurrentRole();
    this.leerIdRuta();
    if (this.solicitudId !== null) {
      this.cargarDetalle();
      this.cargarHistorial();
    }
  }

  rolPuedeClasificar(): boolean {
    return this.userRole === 'ADMINISTRATIVO' || this.userRole === 'COORDINADOR';
  }

  puedeClasificar(): boolean {
    return this.rolPuedeClasificar() && this.solicitud?.estado === 'REGISTRADA';
  }

  cargarDetalle(): void {
    if (this.solicitudId === null) {
      this.error = 'El identificador de solicitud no es valido.';
      this.solicitud = null;
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = '';

    this.solicitudService
      .obtenerSolicitudPorId(this.solicitudId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          this.solicitud = response;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.solicitud = null;
          this.error = this.obtenerMensajeError(error);
          this.cdr.detectChanges();
        }
      });
  }

  actualizarDetalle(): void {
    this.cargarDetalle();
  }

  cargarHistorial(): void {
    if (this.solicitudId === null) {
      this.errorHistorial = 'El identificador de solicitud no es valido para consultar el historial.';
      this.historial = [];
      this.cdr.detectChanges();
      return;
    }

    this.loadingHistorial = true;
    this.errorHistorial = '';

    this.solicitudService
      .obtenerHistorialSolicitud(this.solicitudId)
      .pipe(
        finalize(() => {
          this.loadingHistorial = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          if (!Array.isArray(response)) {
            this.historial = [];
            this.errorHistorial = 'La respuesta del historial no tiene el formato esperado.';
            this.cdr.detectChanges();
            return;
          }

          this.historial = response;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.historial = [];
          this.errorHistorial = this.obtenerMensajeErrorHistorial(error);
          this.cdr.detectChanges();
        }
      });
  }

  actualizarHistorial(): void {
    this.cargarHistorial();
  }

  clasificarSolicitud(): void {
    this.errorClasificacion = '';
    this.exitoClasificacion = '';

    if (!this.solicitud?.id) {
      this.errorClasificacion = 'No se pudo identificar la solicitud a clasificar.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.puedeClasificar()) {
      this.errorClasificacion = 'Esta solicitud no puede clasificarse en su estado actual.';
      this.cdr.detectChanges();
      return;
    }

    const errorValidacion = this.validarFormularioClasificacion();
    if (errorValidacion) {
      this.errorClasificacion = errorValidacion;
      this.cdr.detectChanges();
      return;
    }

    const request: ClasificarSolicitudRequest = {
      tipoSolicitud: this.clasificacionForm.tipoSolicitud as TipoSolicitudNombre,
      impacto: this.clasificacionForm.impacto as ImpactoAcademico,
      fechaLimite: this.normalizarFechaLimite(this.clasificacionForm.fechaLimite),
      observacion: this.clasificacionForm.observacion?.trim() || null
    };

    this.clasificando = true;

    this.solicitudService
      .clasificarSolicitud(this.solicitud.id, request)
      .pipe(
        finalize(() => {
          this.clasificando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.errorClasificacion = '';
          this.exitoClasificacion = 'Solicitud clasificada correctamente.';
          this.clasificacionForm = {
            tipoSolicitud: '',
            impacto: '',
            fechaLimite: '',
            observacion: ''
          };
          this.cargarDetalle();
          this.cargarHistorial();
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.exitoClasificacion = '';
          this.errorClasificacion = this.obtenerMensajeErrorClasificacion(error);
          this.cdr.detectChanges();
        }
      });
  }

  volverAMisSolicitudes(): void {
    this.router.navigate(['/dashboard/solicitudes/mis-solicitudes']);
  }

  private leerIdRuta(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!idParam || Number.isNaN(id) || id <= 0) {
      this.error = 'El identificador de solicitud no es valido.';
      this.solicitud = null;
      this.loading = false;
      this.solicitudId = null;
      this.cdr.detectChanges();
      return;
    }

    this.solicitudId = id;
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible cargar el detalle de la solicitud.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el backend.';
    }

    if (error.status === 401 || error.status === 403) {
      return 'Tu sesion expiro o no tienes permisos para ver esta solicitud.';
    }

    if (error.status === 404) {
      return 'No se encontro la solicitud solicitada.';
    }

    if (error.status >= 500) {
      return 'El servidor tuvo un problema al consultar el detalle.';
    }

    return 'No fue posible cargar el detalle de la solicitud.';
  }

  private obtenerMensajeErrorHistorial(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible cargar el historial de la solicitud.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el backend.';
    }

    if (error.status === 401 || error.status === 403) {
      return 'Tu sesion expiro o no tienes permisos para ver el historial.';
    }

    if (error.status === 404) {
      return 'No se encontro el historial de esta solicitud.';
    }

    if (error.status >= 500) {
      return 'El servidor tuvo un problema al consultar el historial.';
    }

    return 'No fue posible cargar el historial de la solicitud.';
  }

  private normalizarFechaLimite(fecha: string): string {
    const valor = fecha?.trim();

    if (!valor) {
      return '';
    }

    if (valor.length === 16) {
      return `${valor}:00`;
    }

    return valor;
  }

  private validarFormularioClasificacion(): string {
    if (!this.clasificacionForm.tipoSolicitud) {
      return 'Debes seleccionar el tipo de solicitud.';
    }

    if (!this.clasificacionForm.impacto) {
      return 'Debes seleccionar el impacto academico.';
    }

    if (!this.clasificacionForm.fechaLimite?.trim()) {
      return 'Debes seleccionar la fecha limite.';
    }

    if (this.clasificacionForm.observacion && this.clasificacionForm.observacion.length > 500) {
      return 'La observacion no puede superar los 500 caracteres.';
    }

    return '';
  }

  private obtenerMensajeErrorClasificacion(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo clasificar la solicitud.';
    }

    if (error.status === 400) {
      return 'Datos invalidos. Revisa el tipo, impacto y fecha limite.';
    }

    if (error.status === 403) {
      return 'No tienes permisos para clasificar esta solicitud.';
    }

    if (error.status === 404) {
      return 'La solicitud no existe.';
    }

    if (error.status === 409) {
      return 'La solicitud no puede clasificarse porque no esta en estado REGISTRADA o falta informacion requerida.';
    }

    if (error.status >= 500) {
      return 'Error del servidor al clasificar la solicitud.';
    }

    return 'No se pudo clasificar la solicitud.';
  }
}
