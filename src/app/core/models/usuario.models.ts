import { RolNombre } from './enums.models';

export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  identificacion?: string;
  rol: RolNombre;
  activo?: boolean;
}
