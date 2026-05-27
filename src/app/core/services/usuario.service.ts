import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api.config';
import { UsuarioResponse } from '../models/usuario.models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  constructor(private http: HttpClient) {}

  listarResponsables(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(API_ENDPOINTS.usuarios.responsables);
  }
}
