import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api.config';
import { SolicitudCreateRequest, SolicitudHistorialResponse, SolicitudResponse, SugerenciaClasificacionRequest, SugerenciaClasificacionResponse } from '../models/solicitud.models';

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  constructor(private http: HttpClient) {}

  getMisSolicitudes(): Observable<SolicitudResponse[]> {
    return this.http.get<SolicitudResponse[]>(API_ENDPOINTS.solicitudes.base);
  }

  obtenerSolicitudPorId(id: number): Observable<SolicitudResponse> {
    return this.http.get<SolicitudResponse>(API_ENDPOINTS.solicitudes.detail(id));
  }

  obtenerHistorialSolicitud(id: number): Observable<SolicitudHistorialResponse[]> {
    return this.http.get<SolicitudHistorialResponse[]>(API_ENDPOINTS.solicitudes.historial(id));
  }

  sugerirClasificacion(request: SugerenciaClasificacionRequest): Observable<SugerenciaClasificacionResponse> {
    return this.http.post<SugerenciaClasificacionResponse>(API_ENDPOINTS.ia.sugerirClasificacion, request);
  }

  crearSolicitud(request: SolicitudCreateRequest): Observable<SolicitudResponse> {
    return this.http.post<SolicitudResponse>(API_ENDPOINTS.solicitudes.base, request);
  }
}
