import { Injectable } from '@angular/core';
import { JwtPayload, RolNombre } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly TOKEN_KEY = 'auth-token';

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  getPayload(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      const payload = JSON.parse(decodeURIComponent(escape(window.atob(padded))));
      return payload;
    } catch {
      return null;
    }
  }

  getRole(): RolNombre | null {
    return this.getPayload()?.rol ?? null;
  }

  getEmail(): string | null {
    return this.getPayload()?.email ?? this.getPayload()?.sub ?? null;
  }

  getUserId(): number | null {
    const payload = this.getPayload();
    const id = payload?.usuarioId ?? payload?.userId ?? payload?.id;
    return typeof id === 'number' ? id : null;
  }

  isTokenExpired(): boolean {
    const payload = this.getPayload();
    if (!payload?.exp) return false;
    return Date.now() >= payload.exp * 1000;
  }
}
