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
 *    - XAMPP corriendo (Apache + MySQL/MariaDB)
 *    - Base de datos: db_asistencia
 * ============================================================
 */

const express  = require('express');
const mysql    = require('mysql2/promise');
const multer   = require('multer');
const cors     = require('cors');
const path     = require('path');

const app  = express();
const PORT = 3000; // Puerto del backend (distinto al 8085 de Apache)

// ============================================================
//  MIDDLEWARES
// ============================================================
app.use(cors());
app.use(express.json());

// ============================================================
//  CONFIGURACIÓN DE LA BASE DE DATOS
//  ← MODIFICA ESTOS VALORES SI CAMBIAN
// ============================================================
const DB_CONFIG = {
  host:     'localhost',   // IP del servidor donde corre MariaDB
  port:     3306,          // Puerto de MariaDB (XAMPP usa 3306 por defecto)
  database: 'db_asistencia', // Nombre de tu base de datos
  user:     'root',        // Usuario de MariaDB
  password: '1234',        // Contraseña de MariaDB
  waitForConnections: true,
  connectionLimit:    10,
};

// Pool de conexiones (más eficiente que una conexión simple)
const pool = mysql.createPool(DB_CONFIG);

// Verificar conexión al iniciar
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conectado a MariaDB — db_asistencia');
    conn.release();
  } catch (err) {
    console.error('❌ Error conectando a MariaDB:', err.message);
    console.error('   Verifica que XAMPP esté corriendo y los datos de conexión sean correctos.');
  }
})();

// ============================================================
//  CONFIGURACIÓN DE MULTER (manejo de archivos/fotos)
//  Guarda la foto en memoria para luego insertarla como BLOB
// ============================================================
const storage = multer.memoryStorage(); // Foto en RAM → luego a LONGBLOB
const upload  = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Máximo 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes JPG o PNG'));
    }
  },
});

// ============================================================
//  RUTA: POST /auth/login
//  Autentica al alumno con no_cuenta + nip
// ============================================================
/**
 * Body esperado:
 * { "no_cuenta": "14076055", "nip": "1234" }
 *
 * Respuesta exitosa:
 * {
 *   "success": true,
 *   "usuario": {
 *     "no_cuenta": 14076055,
 *     "nombres": "ISRAEL",
 *     "apellido_paterno": "MEDINA",
 *     "apellido_materno": "CHAVEZ",
 *     "carrera": "IS",
 *     "grupo": "1",
 *     "grado": 3,
 *     "tiene_foto": false
 *   }
 * }
 */
app.post('/auth/login', async (req, res) => {
  const { no_cuenta, nip } = req.body;

  if (!no_cuenta || !nip) {
    return res.status(400).json({
      success: false,
      message: 'No. de cuenta y NIP son requeridos.',
    });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT no_cuenta, nombres, apellido_paterno, apellido_materno,
              carrera, grupo, grado,
              CASE WHEN foto IS NOT NULL THEN 1 ELSE 0 END AS tiene_foto
       FROM Alumnos
       WHERE no_cuenta = ? AND nip = ?
       LIMIT 1`,
      [no_cuenta, nip]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Número de cuenta o NIP incorrecto.',
      });
    }

    const alumno = rows[0];
    return res.json({
      success: true,
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
    console.error('[LOGIN] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.',
    });
  }
});

// ============================================================
//  RUTA: POST /auth/registro
//  Registra el NIP de un alumno nuevo (primera vez)
// ============================================================
/**
 * Body esperado:
 * { "no_cuenta": "14076055", "nip": "5678", "nip_confirmacion": "5678" }
 *
 * Verifica que el no_cuenta exista en la tabla Alumnos
 * y que NO tenga NIP ya registrado (para evitar sobreescribir).
 */
app.post('/auth/registro', async (req, res) => {
  const { no_cuenta, nip, nip_confirmacion } = req.body;

  if (!no_cuenta || !nip || !nip_confirmacion) {
    return res.status(400).json({
      success: false,
      message: 'Todos los campos son requeridos.',
    });
  }

  if (nip !== nip_confirmacion) {
    return res.status(400).json({
      success: false,
      message: 'Los NIPs no coinciden.',
    });
  }

  if (nip.length < 4 || nip.length > 10) {
    return res.status(400).json({
      success: false,
      message: 'El NIP debe tener entre 4 y 10 dígitos.',
    });
  }

  try {
    // Verificar que el no_cuenta existe
    const [alumno] = await pool.execute(
      'SELECT no_cuenta, nip FROM Alumnos WHERE no_cuenta = ? LIMIT 1',
      [no_cuenta]
    );

    if (alumno.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Número de cuenta no encontrado en el sistema.',
      });
    }

    // Verificar que no tenga NIP ya registrado
    if (alumno[0].nip !== null) {
      return res.status(409).json({
        success: false,
        message: 'Este alumno ya tiene un NIP registrado. Usa "Ya soy usuario".',
      });
    }

    // Registrar el NIP
    await pool.execute(
      'UPDATE Alumnos SET nip = ? WHERE no_cuenta = ?',
      [nip, no_cuenta]
    );

    return res.json({
      success: true,
      message: 'NIP registrado correctamente. Ahora puedes iniciar sesión.',
    });

  } catch (err) {
    console.error('[REGISTRO] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.',
    });
  }
});

// ============================================================
//  RUTA: POST /usuario/foto
//  Guarda la foto del alumno como LONGBLOB en MariaDB
// ============================================================
/**
 * Multipart form-data:
 *   - Campo "foto": archivo de imagen (JPG/PNG)
 *   - Campo "no_cuenta": número de cuenta del alumno
 *
 * La foto se guarda directamente en el campo `foto` LONGBLOB
 * de la tabla Alumnos.
 */
app.post('/usuario/foto', upload.single('foto'), async (req, res) => {
  const { no_cuenta } = req.body;

  if (!no_cuenta) {
    return res.status(400).json({
      success: false,
      message: 'No. de cuenta requerido.',
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No se recibió ninguna imagen.',
    });
  }

  try {
    // req.file.buffer contiene los bytes de la foto (gracias a memoryStorage)
    const fotoBuffer = req.file.buffer;

    await pool.execute(
      'UPDATE Alumnos SET foto = ? WHERE no_cuenta = ?',
      [fotoBuffer, no_cuenta]
    );

    console.log(`[FOTO] Foto guardada para no_cuenta: ${no_cuenta} | Tamaño: ${(fotoBuffer.length / 1024).toFixed(1)} KB`);

    return res.json({
      success: true,
      message: 'Foto guardada correctamente.',
    });

  } catch (err) {
    console.error('[FOTO] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Error al guardar la foto.',
    });
  }
});

// ============================================================
//  RUTA: GET /usuario/perfil/:no_cuenta
//  Obtiene datos del alumno (sin la foto, para no pesar)
// ============================================================
app.get('/usuario/perfil/:no_cuenta', async (req, res) => {
  const { no_cuenta } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT no_cuenta, nombres, apellido_paterno, apellido_materno,
              carrera, grupo, grado,
              CASE WHEN foto IS NOT NULL THEN 1 ELSE 0 END AS tiene_foto
       FROM Alumnos
       WHERE no_cuenta = ?
       LIMIT 1`,
      [no_cuenta]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Alumno no encontrado.' });
    }

    return res.json({ success: true, usuario: rows[0] });

  } catch (err) {
    console.error('[PERFIL] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
});

// ============================================================
//  RUTA: GET /health
//  Verificar que el servidor esté corriendo
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
