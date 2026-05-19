/**
 * ============================================================
 *  ARCHIVO DE CONFIGURACIÓN Y SERVICIOS DE API
 *  AutomaticAssistence - Conexión a MariaDB via Backend REST
 * ============================================================
 *
 *  IMPORTANTE: React Native NO se conecta directo a MariaDB.
 *  La arquitectura correcta es:
 *
 *    [React Native App]  ──HTTP──►  [Tu Servidor Backend]  ──SQL──►  [MariaDB]
 *
 *  Tu backend puede ser Node.js/Express, Laravel, FastAPI, etc.
 *  Este archivo apunta a ese backend.
 *
 * ============================================================
 */

import axios from 'axios';

// ============================================================
//  ⚙️  CONFIGURACIÓN — MODIFICA ESTOS VALORES
// ============================================================

const API_CONFIG = {
  /**
   * URL base de tu servidor backend.
   *
   * Ejemplos:
   *   - Servidor local con Android Emulator: 'http://10.0.2.2:3000'
   *     (10.0.2.2 es el alias del localhost de tu PC en el emulador)
   *   - Servidor local con dispositivo físico: 'http://192.168.X.X:3000'
   *     (usa la IP local de tu PC en la misma red WiFi)
   *   - Producción: 'https://api.tudominio.com'
   */
  BASE_URL: 'http://192.168.1.103:8050',

  /**
   * Tiempo máximo de espera para las peticiones (en milisegundos)
   */
  TIMEOUT: 10000,

  /**
   * Headers por defecto para todas las peticiones
   */
  HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

// ============================================================
//  INSTANCIA DE AXIOS (cliente HTTP)
// ============================================================

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// ============================================================
//  ENDPOINTS — MODIFICA SEGÚN TUS RUTAS DE BACKEND
// ============================================================

/**
 * Estas son las rutas que tu backend debe implementar.
 * Ejemplo en Express.js:
 *
 *   app.post('/auth/login', (req, res) => { ... })
 *   app.post('/usuario/foto', upload.single('foto'), (req, res) => { ... })
 *   app.get('/usuario/perfil/:noCuenta', (req, res) => { ... })
 */
const ENDPOINTS = {
  LOGIN: '/auth/login',
  UPLOAD_PHOTO: '/usuario/foto',
  GET_PROFILE: '/usuario/perfil',
};

// ============================================================
//  SERVICIO: AUTENTICACIÓN (LOGIN)
// ============================================================

/**
 * Autentica al usuario con su número de cuenta y NIP.
 *
 * @param {string} noCuenta - Número de cuenta del usuario
 * @param {string} nip      - NIP del usuario
 * @returns {Object} Datos del usuario si el login es exitoso
 *
 * ── QUÉ DEBE DEVOLVER TU BACKEND ──────────────────────────
 * Respuesta exitosa (HTTP 200):
 * {
 *   "success": true,
 *   "usuario": {
 *     "id": 1,                          ← ID interno
 *     "no_cuenta": "123456789",          ← Número de cuenta
 *     "nombre": "Juan Pérez López",      ← Nombre completo
 *     "foto_url": null | "ruta/foto.jpg" ← NULL si no tiene foto
 *   }
 * }
 *
 * Respuesta fallida (HTTP 401):
 * {
 *   "success": false,
 *   "message": "Credenciales incorrectas"
 * }
 *
 * ── CONSULTA SQL QUE DEBES HACER EN EL BACKEND ────────────
 * SELECT id, no_cuenta, nombre, foto_url
 * FROM usuarios                         ← Cambia "usuarios" por tu tabla
 * WHERE no_cuenta = ? AND nip = ?       ← Cambia los campos por los tuyos
 * LIMIT 1;
 *
 * CAMPOS DE TU TABLA usuarios (ajusta los nombres):
 *   - no_cuenta  → tu campo de número de cuenta
 *   - nip        → tu campo de NIP (idealmente hasheado con bcrypt)
 *   - nombre     → tu campo de nombre completo del usuario
 *   - foto_url   → tu campo que almacena la ruta/URL de la foto
 * ──────────────────────────────────────────────────────────
 */


// ============================================================
//  SERVICIO: OBTENER PERFIL DEL USUARIO
// ============================================================

/**
 * Obtiene el perfil completo del usuario, incluyendo si tiene foto.
 *
 * @param {string|number} userId - ID del usuario (obtenido del login)
 * @returns {Object} Datos del perfil
 *
 * ── QUÉ DEBE DEVOLVER TU BACKEND ──────────────────────────
 * {
 *   "success": true,
 *   "usuario": {
 *     "id": 1,
 *     "nombre": "Juan Pérez López",
 *     "foto_url": null               ← NULL = necesita tomar foto
 *   }
 * }
 *
 * ── CONSULTA SQL EN EL BACKEND ────────────────────────────
 * SELECT id, nombre, foto_url
 * FROM usuarios                      ← Tu tabla de usuarios
 * WHERE id = ?;                      ← Tu campo de ID
 * ──────────────────────────────────────────────────────────
 */
export const obtenerPerfil = async userId => {
  try {
    const response = await apiClient.get(`${ENDPOINTS.GET_PROFILE}/${userId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Error al obtener perfil');
    }
    throw new Error('No se pudo conectar al servidor.');
  }
};

// ============================================================
//  SERVICIO: SUBIR FOTO AL SERVIDOR
// ============================================================

/**
 * Sube la foto capturada por la cámara al servidor backend,
 * que a su vez la guarda en MariaDB (como BLOB o como ruta de archivo).
 *
 * @param {number} userId    - ID del usuario
 * @param {string} fotoUri   - URI local de la foto (ej: 'file:///storage/...')
 * @returns {Object} Confirmación del servidor
 *
 * ── CÓMO ENVÍA LA FOTO ESTE SERVICIO ──────────────────────
 * Se usa multipart/form-data (FormData), el estándar para subir archivos.
 * El campo se llama "foto". Tu backend debe leerlo con ese nombre.
 *
 * ── QUÉ DEBE HACER TU BACKEND AL RECIBIR LA FOTO ──────────
 *
 * Opción A — Guardar como archivo en disco:
 *   1. Recibir el archivo con multer (Node.js) o similar
 *   2. Guardarlo en una carpeta (ej: /uploads/fotos/)
 *   3. Guardar en MariaDB solo la RUTA del archivo:
 *      UPDATE usuarios SET foto_url = '/uploads/fotos/user_1.jpg' WHERE id = ?;
 *
 * Opción B — Guardar como BLOB en MariaDB:
 *   1. Leer los bytes del archivo
 *   2. Guardarlos directamente:
 *      UPDATE usuarios SET foto_blob = ? WHERE id = ?;
 *   (Nota: los BLOBs hacen la BD más pesada, se recomienda Opción A)
 *
 * ── CAMPOS DE LA TABLA USUARIOS PARA LA FOTO ──────────────
 *   Opción A: foto_url  VARCHAR(500)  → Ruta o URL del archivo
 *   Opción B: foto_blob LONGBLOB      → Bytes de la imagen
 *   (Solo necesitas UNO de los dos)
 *
 * ── CONSULTA SQL PARA ACTUALIZAR ─────────────────────────
 *   UPDATE usuarios
 *   SET foto_url = ?        ← O foto_blob = ?
 *   WHERE id = ?;
 * ──────────────────────────────────────────────────────────
 */
export const subirFoto = async (userId, fotoUri) => {
  try {
    const formData = new FormData();

    // Extraer nombre del archivo desde la URI
    const nombreArchivo = fotoUri.split('/').pop() || 'foto.jpg';

    // Agregar la foto al FormData
    formData.append('foto', {       // ← 'foto' es el nombre del campo, cámbialo si tu backend usa otro
      uri: fotoUri,
      type: 'image/jpeg',           // ← Tipo MIME de la imagen
      name: nombreArchivo,
    });

    // Agregar el ID del usuario
    formData.append('usuario_id', userId.toString()); // ← Cambia 'usuario_id' si tu backend usa otro nombre

    const response = await apiClient.post(ENDPOINTS.UPLOAD_PHOTO, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Necesario para subir archivos
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Error al subir la foto');
    }
    throw new Error('No se pudo conectar al servidor.');
  }
};

/**
 * Registra un nuevo NIP para un alumno existente.
 */
export const registrarAlumno = async (noCuenta, nip) => {
  try {
    const response = await apiClient.post('/auth/registro', {
      no_cuenta: noCuenta,
      nip: nip
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Error al registrar');
    }
    throw new Error('No se pudo conectar al servidor.');
  }
};

export default apiClient;
