export type RolNombre = 'ESTUDIANTE' | 'ADMINISTRATIVO' | 'COORDINADOR';

export type EstadoSolicitud =
  | 'REGISTRADA'
  | 'CLASIFICADA'
  | 'EN_ATENCION'
  | 'ATENDIDA'
  | 'CERRADA';

export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type TipoSolicitudNombre =
  | 'HOMOLOGACION'
  | 'SOLICITUD_CUPO'
  | 'CANCELACION_ASIGNATURA'
  | 'REGISTRO_ASIGNATURA'
  | 'CONSULTA_ACADEMICA'
  | 'OTRO';

export type CanalOrigen =
  | 'CSU'
  | 'CORREO'
  | 'SAC'
  | 'TELEFONICO'
  | 'PRESENCIAL'
  | 'OTRO';

export type ImpactoAcademico =
  | 'BAJO'
  | 'MEDIO'
  | 'ALTO'
  | 'CRITICO';
