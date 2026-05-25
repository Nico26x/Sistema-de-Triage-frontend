import {
  CanalOrigen,
  ImpactoAcademico,
  Prioridad,
  TipoSolicitudNombre,
} from './enums.models';

export interface SugerenciaIaRequest {
  descripcion: string;
  impacto?: ImpactoAcademico | null;
  fechaLimite?: string | null;
  canal?: CanalOrigen | null;
}

export interface SugerenciaIaResponse {
  tipoSugerido: TipoSolicitudNombre;
  prioridadSugerida: Prioridad;
  justificacion: string;
  requiereConfirmacionHumana: boolean;
  fuente: 'IA' | 'REGLAS_FALLBACK';
}
