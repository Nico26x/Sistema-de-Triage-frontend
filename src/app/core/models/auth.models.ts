import { RolNombre } from './enums.models';
export type { RolNombre };

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  identificacion: string;
  password: string;
  rol: RolNombre;
}

export interface AuthResponse {
  token: string;
  tipo?: string;
  usuarioId?: number;
  email?: string;
  rol?: RolNombre;
}

export interface JwtPayload {
  sub?: string;
  email?: string;
  rol?: RolNombre;
  usuarioId?: number;
  userId?: number;
  id?: number;
  exp?: number;
  iat?: number;
}
