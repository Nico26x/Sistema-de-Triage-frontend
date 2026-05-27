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

export interface SugerenciaClasificacionRequest {
  descripcion: string;
  impacto?: ImpactoAcademico | null;
  fechaLimite?: string | null;
  canal?: CanalOrigen | null;
}

export interface SugerenciaClasificacionResponse {
  tipoSugerido?: TipoSolicitudNombre | null;
  impactoSugerido?: ImpactoAcademico | null;
  canalSugerido?: CanalOrigen | null;
  prioridadSugerida?: Prioridad | null;
  justificacion?: string | null;
  requiereConfirmacionHumana?: boolean;
  fuente?: string | null;
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

export type AccionHistorial =
  | 'REGISTRO'
  | 'CLASIFICACION'
  | 'PRIORIZACION'
  | 'ASIGNACION'
  | 'CAMBIO_ESTADO'
  | 'CIERRE'
  | 'OBSERVACION';

export interface SolicitudHistorialResponse {
  fechaHora?: string | null;
  accion?: AccionHistorial | null;
  observacion?: string | null;
  estadoAnterior?: EstadoSolicitud | null;
  estadoNuevo?: EstadoSolicitud | null;
  actorId?: number | null;
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
