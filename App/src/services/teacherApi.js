import apiClient from './api';

/**
 * Obtiene la lista completa de alumnos desde la BD.
 * El dashboard docente llama esto al levantar sesion.
 */
export const obtenerAlumnos = async () => {
  try {
    const response = await apiClient.get('/alumnos');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Error al obtener alumnos');
    }
    throw new Error('No se pudo conectar al servidor. Esta corriendo server.js?');
  }
};
