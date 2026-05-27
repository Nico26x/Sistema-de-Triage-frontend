import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api.config';
import { CambiarEstadoSolicitudRequest, CerrarSolicitudRequest, ClasificarSolicitudRequest, SolicitudCreateRequest, SolicitudFiltros, SolicitudHistorialResponse, SolicitudResponse, SugerenciaClasificacionRequest, SugerenciaClasificacionResponse } from '../models/solicitud.models';

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  constructor(private http: HttpClient) {}

  getMisSolicitudes(filtros?: SolicitudFiltros): Observable<SolicitudResponse[]> {
    let params = new HttpParams();

    if (filtros?.estado) {
      params = params.set('estado', filtros.estado);
    }

    if (filtros?.prioridad) {
      params = params.set('prioridad', filtros.prioridad);
    }

    if (filtros?.tipoSolicitud) {
      params = params.set('tipoSolicitud', filtros.tipoSolicitud);
    }

    if (filtros?.canalOrigen) {
      params = params.set('canalOrigen', filtros.canalOrigen);
    }

    if (filtros?.desde) {
      params = params.set('desde', filtros.desde);
    }

    if (filtros?.hasta) {
      params = params.set('hasta', filtros.hasta);
    }

    return this.http.get<SolicitudResponse[]>(API_ENDPOINTS.solicitudes.base, { params });
  }

  listarSolicitudes(filtros?: SolicitudFiltros): Observable<SolicitudResponse[]> {
    return this.getMisSolicitudes(filtros);
  }

  obtenerSolicitudPorId(id: number): Observable<SolicitudResponse> {
    return this.http.get<SolicitudResponse>(API_ENDPOINTS.solicitudes.detail(id));
  }

  obtenerHistorialSolicitud(id: number): Observable<SolicitudHistorialResponse[]> {
    return this.http.get<SolicitudHistorialResponse[]>(API_ENDPOINTS.solicitudes.historial(id));
  }

  clasificarSolicitud(id: number, request: ClasificarSolicitudRequest): Observable<SolicitudResponse> {
    return this.http.put<SolicitudResponse>(API_ENDPOINTS.solicitudes.clasificar(id), request);
  }

  cambiarEstadoSolicitud(id: number, request: CambiarEstadoSolicitudRequest): Observable<SolicitudResponse> {
    return this.http.put<SolicitudResponse>(API_ENDPOINTS.solicitudes.cambiarEstado(id), request);
  }

  cerrarSolicitud(id: number, request: CerrarSolicitudRequest): Observable<SolicitudResponse> {
    return this.http.put<SolicitudResponse>(API_ENDPOINTS.solicitudes.cerrar(id), request);
  }

  sugerirClasificacion(request: SugerenciaClasificacionRequest): Observable<SugerenciaClasificacionResponse> {
    return this.http.post<SugerenciaClasificacionResponse>(API_ENDPOINTS.ia.sugerirClasificacion, request);
  }

  crearSolicitud(request: SolicitudCreateRequest): Observable<SolicitudResponse> {
    return this.http.post<SolicitudResponse>(API_ENDPOINTS.solicitudes.base, request);
  }
}
