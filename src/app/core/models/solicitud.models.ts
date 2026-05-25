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
  solicitanteId?: number;
  impacto: ImpactoAcademico;
  fechaLimite?: string | null;
  tipo: TipoSolicitudNombre;
}

export interface SolicitudResponse {
  id: number;
  descripcion: string;
  canal?: CanalOrigen;
  solicitante?: string;
  solicitanteId?: number;
  responsable?: string;
  responsableId?: number;
  tipo?: TipoSolicitudNombre;
  prioridad?: Prioridad;
  estadoActual?: EstadoSolicitud;
  impacto?: ImpactoAcademico;
  fechaRegistro?: string;
  fechaLimite?: string | null;
  justificacionPrioridad?: string;
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
