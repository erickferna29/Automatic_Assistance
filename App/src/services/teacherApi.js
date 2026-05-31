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
    if (error.response) {
      throw new Error(error.response.data.message || 'Error de autenticación');
    }

    throw new Error('No se pudo conectar al servidor. Verifica la IP en api.js');
  }
};

/**
 * Obtiene alumnos inscritos en una materia específica.
 * Backend actual:
 * GET /alumnos/materia/:codigo_materia
 */
export const obtenerAlumnosMateria = async (codigoMateria) => {
  try {
    const response = await apiClient.get(`/alumnos/materia/${codigoMateria}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Error al obtener alumnos');
    }

    throw new Error('No se pudo conectar al servidor.');
  }
};

/**
 * Obtiene alumnos activos detectados por BLE en una sesión.
 * Backend actual:
 * GET /alumnos_activos/:id_sesion
 */
export const obtenerAlumnosActivos = async (idSesion) => {
  try {
    const response = await apiClient.get(`/alumnos_activos/${idSesion}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Error al obtener alumnos activos');
    }

    throw new Error('No se pudo conectar al servidor.');
  }
};

/**
 * Inicia una nueva sesión de clase.
 * Backend actual:
 * POST /sesion/iniciar
 *
 * Body:
 * {
 *   no_empleado,
 *   codigo_materia
 * }
 */
export const iniciarSesion = async (noEmpleado, codigoMateria) => {
  try {
    console.log('POST /sesion/iniciar BODY:', {
      no_empleado: String(noEmpleado),
      codigo_materia: String(codigoMateria),
    });

    const response = await apiClient.post('/sesion/iniciar', {
      no_empleado: String(noEmpleado),
      codigo_materia: String(codigoMateria),
    });

    console.log('POST /sesion/iniciar RESPONSE:', response.data);

    return response.data;
  } catch (error) {
    console.log('POST /sesion/iniciar ERROR:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    if (error.response) {
      throw new Error(
        error.response.data.detail ||
        error.response.data.message ||
        'Error al iniciar sesión'
      );
    }

    throw new Error('No se pudo conectar al servidor.');
  }
};

/**
 * Finaliza una sesión de clase.
 * Backend actual:
 * PUT /sesion/cerrar/:id_sesion
 */
export const cerrarSesion = async (idSesion) => {
  try {
    const response = await apiClient.put(`/sesion/cerrar/${idSesion}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.detail ||
        error.response.data.message ||
        'Error al cerrar sesión'
      );
    }

    throw new Error('No se pudo conectar al servidor.');
  }
};

/**
 * Registra un log BLE manualmente.
 * Backend actual:
 * POST /sesion/log
 *
 * Body:
 * {
 *   id_sesion,
 *   no_cuenta,
 *   intensidad_senal,
 *   fuente
 * }
 */
export const registrarLog = async (idSesion, noCuenta, intensidadSenal = null) => {
  try {
    await apiClient.post('/sesion/log', {
      id_sesion: idSesion,
      no_cuenta: noCuenta.toString(),
      intensidad_senal: intensidadSenal,
      fuente: 'APP',
    });
  } catch (error) {
    console.warn('[LOG-BLE] Error al registrar log:', error.message);
  }
};