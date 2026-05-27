import { RolNombre } from './enums.models';

export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  identificacion?: string;
  rol: RolNombre;
  activo?: boolean;
}

export interface CrearAdministrativoRequest {
  nombre: string;
  apellido: string;
  email: string;
  identificacion: string;
  password: string;
}
