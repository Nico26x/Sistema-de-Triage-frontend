export const API_BASE_URL = 'http://localhost:8080/api/v1';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
  },
  solicitudes: {
    base: `${API_BASE_URL}/solicitudes`,
    detail: (id: number) => `${API_BASE_URL}/solicitudes/${id}`,
    historial: (id: number) => `${API_BASE_URL}/solicitudes/${id}/historial`,
    clasificar: (id: number) => `${API_BASE_URL}/solicitudes/${id}/clasificar`,
    asignar: (id: number) => `${API_BASE_URL}/solicitudes/${id}/asignar`,
    cambiarEstado: (id: number) => `${API_BASE_URL}/solicitudes/${id}/estado`,
    cerrar: (id: number) => `${API_BASE_URL}/solicitudes/${id}/cerrar`,
  },
  usuarios: {
    responsables: `${API_BASE_URL}/usuarios/responsables`,
  },
  ia: {
    sugerirClasificacion: `${API_BASE_URL}/ia/solicitudes/sugerir-clasificacion`,
  },
};
