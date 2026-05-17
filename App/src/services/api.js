import axios from 'axios';

const API_CONFIG = {
  BASE_URL: 'http://10.0.2.2:3000',
  TIMEOUT: 15000,
  HEADERS: { 'Content-Type': 'application/json', Accept: 'application/json' },
};

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

const ENDPOINTS = {
  LOGIN:    '/auth/login',
  REGISTRO: '/auth/registro',
  FOTO:     '/usuario/foto',
  PERFIL:   '/usuario/perfil',
  HEALTH:   '/health',
};

export const loginAlumno = async (noCuenta, nip) => {
  try {
    const response = await apiClient.post(ENDPOINTS.LOGIN, { no_cuenta: noCuenta, nip });
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Error de autenticación');
    throw new Error('No se pudo conectar al servidor. ¿Está corriendo server.js?');
  }
};

export const registrarNip = async (noCuenta, nip, nipConfirmacion) => {
  try {
    const response = await apiClient.post(ENDPOINTS.REGISTRO, {
      no_cuenta: noCuenta, nip, nip_confirmacion: nipConfirmacion,
    });
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Error en el registro');
    throw new Error('No se pudo conectar al servidor.');
  }
};

export const subirFoto = async (noCuenta, fotoUri) => {
  try {
    const formData = new FormData();
    const nombreArchivo = fotoUri.split('/').pop() || 'foto.jpg';
    formData.append('foto', { uri: fotoUri, type: 'image/jpeg', name: nombreArchivo });
    formData.append('no_cuenta', noCuenta.toString());
    const response = await apiClient.post(ENDPOINTS.FOTO, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Error al subir la foto');
    throw new Error('No se pudo conectar al servidor.');
  }
};

export const obtenerPerfil = async noCuenta => {
  try {
    const response = await apiClient.get(`${ENDPOINTS.PERFIL}/${noCuenta}`);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Error al obtener perfil');
    throw new Error('No se pudo conectar al servidor.');
  }
};

export const verificarServidor = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.HEALTH);
    return response.data.status === 'ok';
  } catch { return false; }
};

export default apiClient;
