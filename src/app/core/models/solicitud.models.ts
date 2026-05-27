import {
  CanalOrigen,
  EstadoSolicitud,
  ImpactoAcademico,
  Prioridad,
  TipoSolicitudNombre,
} from './enums.models';

export interface SolicitudCreateRequest {
  descripcion: string;
  canal: CanalOrigen;
  solicitanteId?: number | null;
  impacto: ImpactoAcademico;
  fechaLimite?: string | null;
  tipo: TipoSolicitudNombre;
}

export interface SolicitudResponse {
  id: number;
  descripcion: string;
  fechaRegistro?: string;
  estado?: EstadoSolicitud;
  prioridad?: Prioridad;
  justificacionPrioridad?: string;
  canalOrigen?: CanalOrigen;
  tipoSolicitud?: TipoSolicitudNombre;
  solicitante?: string;
  responsable?: string;
  impacto?: ImpactoAcademico;
  fechaLimite?: string | null;

  // Compatibilidad temporal con nombres antiguos
  canal?: CanalOrigen;
  solicitanteId?: number;
  responsableId?: number;
  tipo?: TipoSolicitudNombre;
  estadoActual?: EstadoSolicitud;
}

export interface SolicitudFilter {
  estado?: EstadoSolicitud;
  prioridad?: Prioridad;
  tipoSolicitud?: TipoSolicitudNombre;
  canalOrigen?: CanalOrigen;
  responsableId?: number;
  desde?: string;
  hasta?: string;
}

export interface HistorialEntry {
  id?: number;
  fechaHora?: string;
  accion: string;
  usuarioResponsable?: string;
  observacion?: string;
}

export interface ClasificarRequest {
  tipoSolicitud: TipoSolicitudNombre;
  impacto: ImpactoAcademico;
  fechaLimite?: string | null;
  observacion?: string;
}

export interface AsignarRequest {
  responsableId: number;
}

export interface CambiarEstadoRequest {
  nuevoEstado: EstadoSolicitud;
  observacion?: string;
}

export interface CerrarRequest {
  observacion: string;
}
