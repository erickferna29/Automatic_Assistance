import apiClient from './api';

/**
 * Login universal: detecta si el número es de Profesor o Alumno.
 * Profesores: no requieren NIP (campo inexistente en la tabla).
 * Alumnos:    requieren NIP.
 */
export const loginUniversal = async (noCuenta, nip = '') => {
  try {
    const response = await apiClient.post('/auth/login-universal', {
      no_cuenta: noCuenta,
      nip: nip || undefined,
    });
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Error de autenticación');
    throw new Error('No se pudo conectar al servidor. ¿Está corriendo server.js?');
  }
};

/**
 * Obtiene la lista completa de alumnos desde la BD.
 * El dashboard docente llama esto al levantar sesion.
 */
export const obtenerAlumnos = async () => {
  try {
    const response = await apiClient.get('/alumnos');
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Error al obtener alumnos');
    throw new Error('No se pudo conectar al servidor. ¿Está corriendo server.js?');
  }
};

/**
 * Crea un registro en Sesiones_Clase con estado ACTIVA.
 * Devuelve el id_sesion generado.
 */
export const iniciarSesion = async (noEmpleado, codigoMateria) => {
  try {
    const response = await apiClient.post('/sesion/iniciar', {
      no_empleado:    noEmpleado,
      codigo_materia: codigoMateria,
    });
    return response.data; // { success: true, id_sesion: N }
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Error al iniciar sesión');
    throw new Error('No se pudo conectar al servidor.');
  }
};

/**
 * Marca la sesión como FINALIZADA y registra fecha_fin.
 */
export const cerrarSesion = async (idSesion) => {
  try {
    const response = await apiClient.put(`/sesion/cerrar/${idSesion}`);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Error al cerrar sesión');
    throw new Error('No se pudo conectar al servidor.');
  }
};

/**
 * Registra un log BLE en Logs_Bluetooth.
 * En producción se llama cuando llega una señal del ESP32/APP.
 */
export const registrarLog = async (idSesion, noCuenta, intensidadSenal = null) => {
  try {
    await apiClient.post('/sesion/log', {
      id_sesion:       idSesion,
      no_cuenta:       noCuenta,
      intensidad_senal: intensidadSenal,
      fuente:          'APP',
    });
  } catch (error) {
    // Logs son fire-and-forget: no bloquear la UI si falla
    console.warn('[LOG-BLE] Error al registrar log:', error.message);
  }
};
