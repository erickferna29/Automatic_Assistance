/**
 * ============================================================
 *  SERVIDOR BACKEND — Automatic Assistence
 *  Node.js + Express + MariaDB
 * ============================================================
 *
 *  INSTALACIÓN (ejecuta en la carpeta /servidor):
 *    npm init -y
 *    npm install express mysql2 multer cors dotenv
 *    node server.js
 *
 *  REQUISITOS:
 *    - Node.js 18+
 *    - Docker corriendo (docker compose up --build -d desde /backend)
 *    - Base de datos: Automatic_Asistance
 * ============================================================
 */

const express  = require('express');
const mysql    = require('mysql2/promise');
const multer   = require('multer');
const cors     = require('cors');
const path     = require('path');

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ============================================================
//  BASE DE DATOS
// ============================================================
const DB_CONFIG = {
  host:     'localhost',
  port:     3306,                  // Docker mapea 3308 -> 3306
  database: 'Automatic_Asistance',
  user:     'root',
  password: '1234',
  waitForConnections: true,
  connectionLimit:    10,
};

const pool = mysql.createPool(DB_CONFIG);

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conectado a MariaDB — db_asistencia');
    conn.release();
  } catch (err) {
    console.error('❌ Error conectando a MariaDB:', err.message);
  }
})();

// ============================================================
//  MULTER
// ============================================================
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes JPG o PNG'));
  },
});

// ============================================================
//  RUTA: POST /auth/login-universal
//  Detecta si el número pertenece a un Profesor o Alumno.
//  Profesores: solo no_empleado (sin NIP en la tabla).
//  Alumnos:    no_cuenta + nip.
// ============================================================
app.post('/auth/login-universal', async (req, res) => {
  const { no_cuenta, nip } = req.body;

  if (!no_cuenta) {
    return res.status(400).json({ success: false, message: 'Número de cuenta requerido.' });
  }

  try {
    // ── Buscar en Profesores primero ─────────────────────────
    const [profRows] = await pool.execute(
      `SELECT no_empleado, nombre_profesor, correo,
              GROUP_CONCAT(pm.id_materia) AS materias_ids,
              GROUP_CONCAT(m.nombre_materia) AS materias_nombres
       FROM Profesores p
       LEFT JOIN Profesor_Materia pm ON pm.id_profesor = p.no_empleado
       LEFT JOIN Materias m ON m.codigo_materia = pm.id_materia
       WHERE p.no_empleado = ?
       GROUP BY p.no_empleado
       LIMIT 1`,
      [no_cuenta]
    );

    if (profRows.length > 0) {
      const prof = profRows[0];
      const materiasIds     = prof.materias_ids     ? prof.materias_ids.split(',')     : [];
      const materiasNombres = prof.materias_nombres ? prof.materias_nombres.split(',') : [];

      return res.json({
        success: true,
        tipo: 'profesor',
        usuario: {
          no_empleado:      prof.no_empleado,
          nombre_profesor:  prof.nombre_profesor,
          correo:           prof.correo,
          materias: materiasIds.map((id, i) => ({
            codigo_materia: id,
            nombre_materia: materiasNombres[i] || id,
          })),
        },
      });
    }

    // ── Buscar en Alumnos ────────────────────────────────────
    if (!nip) {
      return res.status(400).json({ success: false, message: 'NIP requerido.' });
    }

    const [alumRows] = await pool.execute(
      `SELECT no_cuenta, nombres, apellido_paterno, apellido_materno,
              carrera, grupo, grado,
              CASE WHEN foto IS NOT NULL THEN 1 ELSE 0 END AS tiene_foto
       FROM Alumnos
       WHERE no_cuenta = ? AND nip = ?
       LIMIT 1`,
      [no_cuenta, nip]
    );

    if (alumRows.length === 0) {
      return res.status(401).json({ success: false, message: 'Número de cuenta o NIP incorrecto.' });
    }

    const alumno = alumRows[0];
    return res.json({
      success: true,
      tipo: 'alumno',
      usuario: {
        no_cuenta:        alumno.no_cuenta,
        nombres:          alumno.nombres,
        apellido_paterno: alumno.apellido_paterno,
        apellido_materno: alumno.apellido_materno,
        carrera:          alumno.carrera,
        grupo:            alumno.grupo,
        grado:            alumno.grado,
        tiene_foto:       alumno.tiene_foto === 1,
      },
    });

  } catch (err) {
    console.error('[LOGIN-UNIVERSAL] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// ============================================================
//  RUTA: POST /auth/login  (Alumnos — mantiene compatibilidad)
// ============================================================
app.post('/auth/login', async (req, res) => {
  const { no_cuenta, nip } = req.body;
  if (!no_cuenta || !nip) {
    return res.status(400).json({ success: false, message: 'No. de cuenta y NIP son requeridos.' });
  }
  try {
    const [rows] = await pool.execute(
      `SELECT no_cuenta, nombres, apellido_paterno, apellido_materno,
              carrera, grupo, grado,
              CASE WHEN foto IS NOT NULL THEN 1 ELSE 0 END AS tiene_foto
       FROM Alumnos WHERE no_cuenta = ? AND nip = ? LIMIT 1`,
      [no_cuenta, nip]
    );
    if (rows.length === 0) return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
    return res.json({ success: true, usuario: { ...rows[0], tiene_foto: rows[0].tiene_foto === 1 } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
});

// ============================================================
//  RUTA: POST /auth/registro
// ============================================================
app.post('/auth/registro', async (req, res) => {
  const { no_cuenta, nip, nip_confirmacion } = req.body;
  if (!no_cuenta || !nip || !nip_confirmacion)
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
  if (nip !== nip_confirmacion)
    return res.status(400).json({ success: false, message: 'Los NIPs no coinciden.' });
  if (nip.length < 4 || nip.length > 10)
    return res.status(400).json({ success: false, message: 'El NIP debe tener entre 4 y 10 dígitos.' });
  try {
    const [alumno] = await pool.execute('SELECT no_cuenta, nip FROM Alumnos WHERE no_cuenta = ? LIMIT 1', [no_cuenta]);
    if (alumno.length === 0) return res.status(404).json({ success: false, message: 'Número de cuenta no encontrado.' });
    if (alumno[0].nip !== null) return res.status(409).json({ success: false, message: 'Este alumno ya tiene un NIP.' });
    await pool.execute('UPDATE Alumnos SET nip = ? WHERE no_cuenta = ?', [nip, no_cuenta]);
    return res.json({ success: true, message: 'NIP registrado correctamente.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
});

// ============================================================
//  RUTA: POST /usuario/foto
// ============================================================
app.post('/usuario/foto', upload.single('foto'), async (req, res) => {
  const { no_cuenta } = req.body;
  if (!no_cuenta) return res.status(400).json({ success: false, message: 'No. de cuenta requerido.' });
  if (!req.file)   return res.status(400).json({ success: false, message: 'No se recibió imagen.' });
  try {
    await pool.execute('UPDATE Alumnos SET foto = ? WHERE no_cuenta = ?', [req.file.buffer, no_cuenta]);
    return res.json({ success: true, message: 'Foto guardada correctamente.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al guardar la foto.' });
  }
});

// ============================================================
//  RUTA: GET /usuario/perfil/:no_cuenta
// ============================================================
app.get('/usuario/perfil/:no_cuenta', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT no_cuenta, nombres, apellido_paterno, apellido_materno,
              carrera, grupo, grado,
              CASE WHEN foto IS NOT NULL THEN 1 ELSE 0 END AS tiene_foto
       FROM Alumnos WHERE no_cuenta = ? LIMIT 1`,
      [req.params.no_cuenta]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Alumno no encontrado.' });
    return res.json({ success: true, usuario: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
});

// ============================================================
//  RUTA: GET /alumnos
//  Lista todos los alumnos para el dashboard docente
// ============================================================
app.get('/alumnos', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT no_cuenta, nombres, apellido_paterno, apellido_materno,
              carrera, grupo, grado,
              CASE WHEN foto IS NOT NULL THEN 1 ELSE 0 END AS tiene_foto
       FROM Alumnos ORDER BY apellido_paterno, nombres`
    );
    return res.json({ success: true, alumnos: rows });
  } catch (err) {
    console.error('[ALUMNOS] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Error al obtener alumnos.' });
  }
});

// ============================================================
//  RUTA: POST /sesion/iniciar
//  Crea un registro en Sesiones_Clase (estado: ACTIVA)
//  Body: { no_empleado, codigo_materia }
// ============================================================
app.post('/sesion/iniciar', async (req, res) => {
  const { no_empleado, codigo_materia } = req.body;
  if (!no_empleado || !codigo_materia) {
    return res.status(400).json({ success: false, message: 'no_empleado y codigo_materia son requeridos.' });
  }
  try {
    const [result] = await pool.execute(
      `INSERT INTO Sesiones_Clase (no_empleado, codigo_materia, estado, fecha_inicio)
       VALUES (?, ?, 'ACTIVA', NOW())`,
      [no_empleado, codigo_materia]
    );
    return res.json({ success: true, id_sesion: result.insertId });
  } catch (err) {
    console.error('[SESION-INICIAR] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Error al iniciar sesión.' });
  }
});

// ============================================================
//  RUTA: PUT /sesion/cerrar/:id_sesion
//  Marca la sesión como FINALIZADA y registra fecha_fin
// ============================================================
app.put('/sesion/cerrar/:id_sesion', async (req, res) => {
  const { id_sesion } = req.params;
  try {
    await pool.execute(
      `UPDATE Sesiones_Clase SET estado = 'FINALIZADA', fecha_fin = NOW()
       WHERE id_sesion = ? AND estado = 'ACTIVA'`,
      [id_sesion]
    );
    return res.json({ success: true, message: 'Sesión cerrada correctamente.' });
  } catch (err) {
    console.error('[SESION-CERRAR] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Error al cerrar sesión.' });
  }
});

// ============================================================
//  RUTA: POST /sesion/log
//  Registra un log BLE en Logs_Bluetooth
//  Body: { id_sesion, no_cuenta, intensidad_senal?, fuente? }
// ============================================================
app.post('/sesion/log', async (req, res) => {
  const { id_sesion, no_cuenta, intensidad_senal = null, fuente = 'APP' } = req.body;
  if (!id_sesion || !no_cuenta) {
    return res.status(400).json({ success: false, message: 'id_sesion y no_cuenta son requeridos.' });
  }
  try {
    await pool.execute(
      `INSERT INTO Logs_Bluetooth (id_sesion, no_cuenta, intensidad_senal, fuente, fecha_hora)
       VALUES (?, ?, ?, ?, NOW())`,
      [id_sesion, no_cuenta, intensidad_senal, fuente]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('[SESION-LOG] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Error al registrar log.' });
  }
});
// ============================================================
//  RUTA: GET /alumnos/materia/:codigo_materia
//  Lista alumnos inscritos en una materia específica
//  Usa tabla Alumno_Materia:
//    id_alumno  -> Alumnos.no_cuenta
//    id_materia -> Materias.codigo_materia
// ============================================================
app.get('/alumnos/materia/:codigo_materia', async (req, res) => {
  const { codigo_materia } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT 
          a.no_cuenta,
          a.nombres,
          a.apellido_paterno,
          a.apellido_materno,
          a.carrera,
          a.grupo,
          a.grado,
          CASE WHEN a.foto IS NOT NULL THEN 1 ELSE 0 END AS tiene_foto
       FROM Alumnos a
       INNER JOIN Alumno_Materia am 
          ON am.id_alumno = a.no_cuenta
       WHERE am.id_materia = ?
       ORDER BY a.apellido_paterno, a.apellido_materno, a.nombres`,
      [codigo_materia]
    );

    return res.json({
      success: true,
      alumnos: rows,
    });
  } catch (err) {
    console.error('[ALUMNOS-MATERIA] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener alumnos de la materia.',
    });
  }
});

// ============================================================
//  RUTA: GET /alumnos_activos/:id_sesion
//  Devuelve alumnos detectados por BLE en una sesión activa
// ============================================================
app.get('/alumnos_activos/:id_sesion', async (req, res) => {
  const { id_sesion } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT 
          lb.no_cuenta,
          MAX(lb.fecha_hora) AS ultima_deteccion,
          COUNT(*) AS total_logs,
          CASE
            WHEN MAX(lb.fecha_hora) >= DATE_SUB(NOW(), INTERVAL 20 SECOND) THEN 'online'
            WHEN MAX(lb.fecha_hora) >= DATE_SUB(NOW(), INTERVAL 2 MINUTE) THEN 'idle'
            ELSE 'offline'
          END AS estado_rt
       FROM Logs_Bluetooth lb
       WHERE lb.id_sesion = ?
       GROUP BY lb.no_cuenta`,
      [id_sesion]
    );

    return res.json({
      success: true,
      alumnos_activos: rows,
    });
  } catch (err) {
    console.error('[ALUMNOS-ACTIVOS] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener alumnos activos.',
    });
  }
});
// ============================================================
//  RUTA: GET /health
// ============================================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mensaje: 'Servidor Automatic Assistence activo' });
});

// ============================================================
//  INICIAR SERVIDOR
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📱 Para el emulador Android usa: http://10.0.2.2:${PORT}`);
  console.log(`📱 Para dispositivo físico usa:  http://TU_IP_LOCAL:${PORT}\n`);
});
