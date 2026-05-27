import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { SolicitudService } from '../../../../services/solicitud.service';
import { UsuarioService } from '../../../../services/usuario.service';
import { AuthService } from '../../../../services/auth.service';
import { EstadoSolicitud, ImpactoAcademico, TipoSolicitudNombre } from '../../../../models/enums.models';
import { AsignarResponsableRequest, CambiarEstadoSolicitudRequest, CerrarSolicitudRequest, ClasificarSolicitudRequest, SolicitudHistorialResponse, SolicitudResponse } from '../../../../models/solicitud.models';
import { UsuarioResponse } from '../../../../models/usuario.models';

@Component({
  standalone: true,
  selector: 'app-solicitud-detail',
  templateUrl: './solicitud-detail.component.html',
  styleUrls: ['./solicitud-detail.component.css'],
  imports: [CommonModule, FormsModule]
})
export class SolicitudDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private solicitudService = inject(SolicitudService);
  private usuarioService = inject(UsuarioService);
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
  formularioClasificacionPrecargado = false;

  cambioEstadoForm = {
    nuevoEstado: '' as EstadoSolicitud | '',
    observacion: ''
  };

  cambiandoEstado = false;
  errorCambioEstado = '';
  exitoCambioEstado = '';

  cierreForm = {
    observacion: ''
  };

  cerrandoSolicitud = false;
  errorCierre = '';
  exitoCierre = '';

  asignacionForm = {
    responsableId: null as number | null
  };

  responsables: UsuarioResponse[] = [];
  cargandoResponsables = false;
  asignandoResponsable = false;
  errorAsignacion = '';
  exitoAsignacion = '';

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

  rolPuedeCambiarEstado(): boolean {
    return this.userRole === 'ADMINISTRATIVO' || this.userRole === 'COORDINADOR';
  }

  puedeCambiarEstado(): boolean {
    return (
      this.rolPuedeCambiarEstado() &&
      (this.solicitud?.estado === 'CLASIFICADA' || this.solicitud?.estado === 'EN_ATENCION')
    );
  }

  obtenerMensajeEstadoAdministrativo(): string {
    switch (this.solicitud?.estado) {
      case 'REGISTRADA':
        return 'Esta solicitud esta pendiente de clasificacion.';
      case 'CLASIFICADA':
        return 'La solicitud ya fue clasificada. Puedes iniciar su atencion.';
      case 'EN_ATENCION':
        return 'La solicitud esta en atencion. Cuando finalice la gestion, marcala como atendida.';
      case 'ATENDIDA':
        return 'La solicitud ya fue atendida. Queda pendiente de cierre por coordinacion.';
      case 'CERRADA':
        return 'La solicitud esta cerrada. Solo lectura.';
      default:
        return '';
    }
  }

  mostrarMensajeEstadoAdministrativo(): boolean {
    return (
      (this.userRole === 'ADMINISTRATIVO' || this.userRole === 'COORDINADOR') &&
      !!this.solicitud?.estado &&
      !!this.obtenerMensajeEstadoAdministrativo()
    );
  }

  obtenerEstadosPermitidosParaCambio(): EstadoSolicitud[] {
    if (this.solicitud?.estado === 'CLASIFICADA') {
      return ['EN_ATENCION'];
    }

    if (this.solicitud?.estado === 'EN_ATENCION') {
      return ['ATENDIDA'];
    }

    return [];
  }

  puedeCerrarSolicitud(): boolean {
    return this.userRole === 'COORDINADOR' && this.solicitud?.estado === 'ATENDIDA';
  }

  puedeAsignarResponsable(): boolean {
    return this.userRole === 'COORDINADOR' && this.solicitud?.estado !== 'CERRADA';
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
          this.precargarFormularioClasificacion();
          this.cargarResponsables();
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

  cargarResponsables(): void {
    if (!this.puedeAsignarResponsable()) {
      this.responsables = [];
      this.cargandoResponsables = false;
      this.cdr.detectChanges();
      return;
    }

    this.cargandoResponsables = true;
    this.errorAsignacion = '';

    this.usuarioService
      .listarResponsables()
      .pipe(
        finalize(() => {
          this.cargandoResponsables = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          const permitidos = Array.isArray(response)
            ? response.filter(
                usuario =>
                  usuario.activo === true && (usuario.rol === 'ADMINISTRATIVO' || usuario.rol === 'COORDINADOR')
              )
            : [];

          this.responsables = permitidos;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.responsables = [];
          this.errorAsignacion = this.obtenerMensajeErrorAsignacion(error);
          this.cdr.detectChanges();
        }
      });
  }

  asignarResponsable(): void {
    this.errorAsignacion = '';
    this.exitoAsignacion = '';

    if (!this.solicitud?.id) {
      this.errorAsignacion = 'No se pudo identificar la solicitud.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.puedeAsignarResponsable()) {
      this.errorAsignacion = 'No tienes permisos para asignar responsable.';
      this.cdr.detectChanges();
      return;
    }

    const errorValidacion = this.validarFormularioAsignacion();
    if (errorValidacion) {
      this.errorAsignacion = errorValidacion;
      this.cdr.detectChanges();
      return;
    }

    const request: AsignarResponsableRequest = {
      responsableId: this.asignacionForm.responsableId as number
    };

    this.asignandoResponsable = true;

    this.solicitudService
      .asignarResponsable(this.solicitud.id, request)
      .pipe(
        finalize(() => {
          this.asignandoResponsable = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.exitoAsignacion = 'Responsable asignado correctamente.';
          this.errorAsignacion = '';
          this.asignacionForm.responsableId = null;
          this.cargarDetalle();
          this.cargarHistorial();
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.errorAsignacion = this.obtenerMensajeErrorAsignacion(error);
          this.exitoAsignacion = '';
          this.cdr.detectChanges();
        }
      });
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

  cambiarEstadoSolicitud(): void {
    this.errorCambioEstado = '';
    this.exitoCambioEstado = '';

    if (!this.solicitud?.id) {
      this.errorCambioEstado = 'No se pudo identificar la solicitud.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.puedeCambiarEstado()) {
      this.errorCambioEstado = 'Esta solicitud no puede cambiar de estado en su estado actual.';
      this.cdr.detectChanges();
      return;
    }

    const errorValidacion = this.validarFormularioCambioEstado();
    if (errorValidacion) {
      this.errorCambioEstado = errorValidacion;
      this.cdr.detectChanges();
      return;
    }

    const request: CambiarEstadoSolicitudRequest = {
      nuevoEstado: this.cambioEstadoForm.nuevoEstado as EstadoSolicitud,
      observacion: this.cambioEstadoForm.observacion?.trim() || null
    };

    this.cambiandoEstado = true;

    this.solicitudService
      .cambiarEstadoSolicitud(this.solicitud.id, request)
      .pipe(
        finalize(() => {
          this.cambiandoEstado = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.exitoCambioEstado = 'Estado actualizado correctamente.';
          this.errorCambioEstado = '';
          this.cambioEstadoForm = {
            nuevoEstado: '',
            observacion: ''
          };
          this.cargarDetalle();
          this.cargarHistorial();
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.errorCambioEstado = this.obtenerMensajeErrorCambioEstado(error);
          this.exitoCambioEstado = '';
          this.cdr.detectChanges();
        }
      });
  }

  cerrarSolicitud(): void {
    this.errorCierre = '';
    this.exitoCierre = '';

    if (!this.solicitud?.id) {
      this.errorCierre = 'No se pudo identificar la solicitud.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.puedeCerrarSolicitud()) {
      this.errorCierre = 'Esta solicitud no puede cerrarse en su estado actual.';
      this.cdr.detectChanges();
      return;
    }

    const errorValidacion = this.validarFormularioCierre();
    if (errorValidacion) {
      this.errorCierre = errorValidacion;
      this.cdr.detectChanges();
      return;
    }

    const request: CerrarSolicitudRequest = {
      observacion: this.cierreForm.observacion.trim()
    };

    this.cerrandoSolicitud = true;

    this.solicitudService
      .cerrarSolicitud(this.solicitud.id, request)
      .pipe(
        finalize(() => {
          this.cerrandoSolicitud = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.exitoCierre = 'Solicitud cerrada correctamente.';
          this.errorCierre = '';
          this.cierreForm = {
            observacion: ''
          };
          this.cargarDetalle();
          this.cargarHistorial();
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.errorCierre = this.obtenerMensajeErrorCierre(error);
          this.exitoCierre = '';
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

  private convertirFechaBackendADatetimeLocal(fecha?: string | null): string {
    if (!fecha?.trim()) {
      return '';
    }

    return fecha.length >= 16 ? fecha.slice(0, 16) : fecha;
  }

  private precargarFormularioClasificacion(): void {
    if (!this.solicitud) {
      return;
    }

    if (!this.puedeClasificar()) {
      return;
    }

    if (this.formularioClasificacionPrecargado) {
      return;
    }

    if (!this.clasificacionForm.tipoSolicitud && this.solicitud.tipoSolicitud) {
      this.clasificacionForm.tipoSolicitud = this.solicitud.tipoSolicitud;
    }

    if (!this.clasificacionForm.impacto && this.solicitud.impacto) {
      this.clasificacionForm.impacto = this.solicitud.impacto;
    }

    if (!this.clasificacionForm.fechaLimite && this.solicitud.fechaLimite) {
      this.clasificacionForm.fechaLimite = this.convertirFechaBackendADatetimeLocal(this.solicitud.fechaLimite);
    }

    this.formularioClasificacionPrecargado = true;
    this.cdr.detectChanges();
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

  private validarFormularioCambioEstado(): string {
    if (!this.cambioEstadoForm.nuevoEstado) {
      return 'Debes seleccionar el nuevo estado.';
    }

    const estadosPermitidos = this.obtenerEstadosPermitidosParaCambio();

    if (!estadosPermitidos.includes(this.cambioEstadoForm.nuevoEstado as EstadoSolicitud)) {
      return 'El estado seleccionado no es valido para esta solicitud.';
    }

    if (this.cambioEstadoForm.observacion && this.cambioEstadoForm.observacion.length > 500) {
      return 'La observacion no puede superar los 500 caracteres.';
    }

    return '';
  }

  private validarFormularioCierre(): string {
    const observacion = this.cierreForm.observacion?.trim() || '';

    if (!observacion) {
      return 'La observacion de cierre es obligatoria.';
    }

    if (observacion.length < 5) {
      return 'La observacion debe tener minimo 5 caracteres.';
    }

    if (observacion.length > 500) {
      return 'La observacion no puede superar los 500 caracteres.';
    }

    return '';
  }

  private validarFormularioAsignacion(): string {
    if (!this.asignacionForm.responsableId || this.asignacionForm.responsableId <= 0) {
      return 'Debes seleccionar un responsable valido.';
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

  private obtenerMensajeErrorCambioEstado(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo cambiar el estado de la solicitud.';
    }

    if (error.status === 400) {
      return 'Datos invalidos. Revisa el nuevo estado seleccionado.';
    }

    if (error.status === 403) {
      return 'No tienes permisos para cambiar el estado de esta solicitud.';
    }

    if (error.status === 404) {
      return 'La solicitud no existe.';
    }

    if (error.status === 409) {
      return 'No se puede realizar esta transicion de estado.';
    }

    if (error.status >= 500) {
      return 'Error del servidor al cambiar el estado de la solicitud.';
    }

    return 'No se pudo cambiar el estado de la solicitud.';
  }

  private obtenerMensajeErrorCierre(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo cerrar la solicitud.';
    }

    if (error.status === 400) {
      return 'La observacion es obligatoria y debe tener entre 5 y 500 caracteres.';
    }

    if (error.status === 403) {
      return 'No tienes permisos para cerrar esta solicitud.';
    }

    if (error.status === 404) {
      return 'La solicitud no existe.';
    }

    if (error.status === 409) {
      return 'La solicitud no puede cerrarse porque no esta en estado ATENDIDA o ya fue cerrada.';
    }

    if (error.status >= 500) {
      return 'Error del servidor al cerrar la solicitud.';
    }

    return 'No se pudo cerrar la solicitud.';
  }

  private obtenerMensajeErrorAsignacion(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo asignar responsable.';
    }

    if (error.status === 400) {
      return 'Debes seleccionar un responsable valido.';
    }

    if (error.status === 403) {
      return 'No tienes permisos para asignar responsable.';
    }

    if (error.status === 404) {
      return 'La solicitud o el responsable no existe.';
    }

    if (error.status === 409) {
      return 'No se puede asignar responsable porque la solicitud esta cerrada o el responsable esta inactivo.';
    }

    if (error.status >= 500) {
      return 'Error del servidor al asignar responsable.';
    }

    return 'No se pudo asignar responsable.';
  }
}
