import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_ENDPOINTS } from '../config/api.config';
import { TokenService } from './token.service';
import { LoginRequest, RegisterRequest, AuthResponse, RolNombre } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient, private tokenService: TokenService) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(API_ENDPOINTS.auth.login, request).pipe(
      tap(response => {
        if (response?.token) {
          this.tokenService.setToken(response.token);
        }
      })
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(API_ENDPOINTS.auth.register, request).pipe(
      tap(response => {
        if (response?.token) {
          this.tokenService.setToken(response.token);
        }
      })
    );
  }

  logout(): void {
    this.tokenService.clearToken();
  }

  isAuthenticated(): boolean {
    return this.tokenService.hasToken() && !this.tokenService.isTokenExpired();
  }

  getCurrentRole(): RolNombre | null {
    return this.tokenService.getRole();
  }
}
