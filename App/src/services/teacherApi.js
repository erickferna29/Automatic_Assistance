import apiClient from './api';

/**
 * Login universal: detecta si el número es de Profesor o Alumno.
 */
export const loginUniversal = async (noCuenta, nip = '') => {
  try {
    const response = await apiClient.post('/auth/login-universal', {
      no_cuenta: noCuenta,
      nip: nip,
    });
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Error de autenticación');
    throw new Error('No se pudo conectar al servidor. Verifica la IP en api.js');
  }
};

/**
 * Obtiene todos los alumnos inscritos en una materia específica.
 * Usada al iniciar la sesión de clase para poblar la lista inicial del Dashboard.
 * @param {string} codigoMateria - Código de la materia
 */
export const obtenerAlumnosMateria = async (codigoMateria) => {
  try {
    const response = await apiClient.get(`/alumnos/${codigoMateria}`);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Error al obtener alumnos');
    throw new Error('No se pudo conectar al servidor.');
  }
};

/**
 * Obtiene los alumnos detectados en tiempo real para una sesión activa.
 * Incluye: total_logs, ultima_deteccion, estado_rt (online/idle/offline), proyeccion.
 * Usada por el polling del Dashboard cada 5 segundos.
 * @param {number} idSesion - ID de la sesión activa
 */
export const obtenerAlumnosActivos = async (idSesion) => {
  try {
    const response = await apiClient.get(`/alumnos_activos/${idSesion}`);
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Error al obtener alumnos activos');
    throw new Error('No se pudo conectar al servidor.');
  }
};

/**
 * Inicia una nueva sesión de clase.
 * Crea un registro en Sesiones_Clase con estado = 'ACTIVA'.
 * @param {string|number} noEmpleado    - Número de empleado del profesor
 * @param {string}        codigoMateria - Código de la materia
 */
export const iniciarSesion = async (noEmpleado, codigoMateria) => {
  try {
    const response = await apiClient.post('/iniciar_clase', {
      no_empleado: String(noEmpleado),
      codigo_materia: codigoMateria,
    });
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.detail || error.response.data.message || 'Error al iniciar sesión');
    throw new Error('No se pudo conectar al servidor.');
  }
};

/**
 * Finaliza la sesión de clase activa del profesor y calcula la asistencia final.
 * El backend identifica la sesión por no_empleado (no por id_sesion).
 * @param {string|number} noEmpleado - Número de empleado del profesor
 */
export const cerrarSesion = async (noEmpleado) => {
  try {
    const response = await apiClient.post('/finalizar_clase', {
      no_empleado: String(noEmpleado),
    });
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.detail || error.response.data.message || 'Error al cerrar sesión');
    throw new Error('No se pudo conectar al servidor.');
  }
};

/**
 * Registra un log BLE manualmente (simula lo que hace el ESP32).
 * Solo útil para pruebas sin hardware.
 * @param {string|number} noCuenta - Número de cuenta del alumno
 */
export const registrarLog = async (noCuenta) => {
  try {
    await apiClient.post('/asistencia', {
      id_alumno: noCuenta.toString(),
    });
  } catch (error) {
    console.warn('[LOG-BLE] Error al registrar log:', error.message);
  }
};