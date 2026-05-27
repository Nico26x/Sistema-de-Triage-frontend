import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api.config';
import { SolicitudCreateRequest, SolicitudResponse } from '../models/solicitud.models';

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  constructor(private http: HttpClient) {}

  getMisSolicitudes(): Observable<SolicitudResponse[]> {
    return this.http.get<SolicitudResponse[]>(API_ENDPOINTS.solicitudes.base);
  }

  crearSolicitud(request: SolicitudCreateRequest): Observable<SolicitudResponse> {
    return this.http.post<SolicitudResponse>(API_ENDPOINTS.solicitudes.base, request);
  }
}
