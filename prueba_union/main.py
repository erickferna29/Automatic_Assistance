import mysql.connector
import shutil
import os
import requests
from fastapi import HTTPException, FastAPI, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

# Asegurar que la carpeta de fotos exista y montarla como estática para poder servir los archivos
os.makedirs("fotos_alumnos", exist_ok=True)
app.mount("/fotos", StaticFiles(directory="fotos_alumnos"), name="fotos")


# ─────────────────────────────────────────────
#  LOG DE CÁMARA PARA PANTALLA OLED
# ─────────────────────────────────────────────
log_camara = "Clase activa"


# ─────────────────────────────────────────────
#  MODELOS
# ─────────────────────────────────────────────

class LoginUniversal(BaseModel):
    no_cuenta: str
    nip: str

class RegistroAlumno(BaseModel):
    no_cuenta: str
    nip: str

class RegistroAsistencia(BaseModel):
    id_alumno: str  # String para filtrar basura bluetooth


class InicioClase(BaseModel):
    no_empleado: str
    codigo_materia: str


class FinClase(BaseModel):
    no_empleado: str  # Solo el profesor que abrió la sesión puede cerrarla


# ─────────────────────────────────────────────
#  CONEXIÓN BD (Optimizado para el contenedor 'db_asistencia')
# ─────────────────────────────────────────────

def conectarbd():
    return mysql.connector.connect(
        host="db_asistencia",
        user="root",
        password="1234",
        database="Automatic_Asistance"
    )


# ─────────────────────────────────────────────
#  GENERAL
# ─────────────────────────────────────────────

@app.get("/")
def inicio():
    return {"status": "online", "message": "Servidor de asistencia listo"}


# ─────────────────────────────────────────────
#  REGISTRO DE ALUMNOS
# ─────────────────────────────────────────────

@app.post("/auth/registro")
def registrar_alumno(data: RegistroAlumno):
    """
    Primer acceso del alumno: valida que exista en BD y le asigna un NIP.
    Si ya tiene NIP, devuelve error para que use el login normal.
    """
    try:
        conexion = conectarbd()
        cursor = conexion.cursor(dictionary=True)

        # 1. Verificar que el alumno exista
        cursor.execute(
            "SELECT no_cuenta, nombres, apellido_paterno, apellido_materno, grupo, grado, carrera, foto, nip FROM Alumnos WHERE no_cuenta = %s",
            (data.no_cuenta,)
        )
        alumno = cursor.fetchone()

        if not alumno:
            cursor.close()
            conexion.close()
            return {
                "success": False,
                "message": "Número de cuenta no encontrado. Verifica tu número o contacta al administrador."
            }

        # 2. Si ya tiene NIP registrado, no permitir re-registro
        if alumno.get("nip"):
            cursor.close()
            conexion.close()
            return {
                "success": False,
                "message": "Este número ya tiene NIP registrado. Usa la opción de Iniciar Sesión."
            }

        # 3. Asignar el NIP
        cursor.execute(
            "UPDATE Alumnos SET nip = %s WHERE no_cuenta = %s",
            (data.nip, data.no_cuenta)
        )
        conexion.commit()

        # 4. Obtener materias inscritas
        cursor.execute(
            """
            SELECT m.codigo_materia, m.nombre_materia
            FROM Alumno_Materia am
                     JOIN Materias m ON am.id_materia = m.codigo_materia
            WHERE am.id_alumno = %s
            """,
            (data.no_cuenta,)
        )
        materias = cursor.fetchall()

        cursor.close()
        conexion.close()

        nombre_completo = (
            f"{alumno.get('nombres', '')} "
            f"{alumno.get('apellido_paterno', '')} "
            f"{alumno.get('apellido_materno', '')}".strip()
        )

        print(f"[REGISTRO] Alumno {data.no_cuenta} ({nombre_completo}) registró NIP exitosamente.")

        return {
            "success": True,
            "message": "NIP registrado exitosamente. Ahora toma tu foto de identificación.",
            "usuario": {
                "id": str(alumno["no_cuenta"]),
                "no_cuenta": str(alumno["no_cuenta"]),
                "nombre": nombre_completo,
                "foto_url": f"/fotos/{alumno['foto']}" if alumno.get("foto") else None,
                "grupo": alumno.get("grupo"),
                "grado": alumno.get("grado"),
                "carrera": alumno.get("carrera"),
                "materias": materias
            }
        }

    except Exception as error:
        print(f"[registro] Error: {error}")
        return {"success": False, "message": "Error interno del servidor"}


# ─────────────────────────────────────────────
#  LOGIN UNIVERSAL (profesores + alumnos)
# ─────────────────────────────────────────────

@app.post("/auth/login-universal")
def login_universal(data: LoginUniversal):
    """
    Login unificado: detecta si el número es de Profesor o Alumno.
    AHORA EXIGE NIP PARA AMBOS OBLIGATORIAMENTE.
    """
    if not data.no_cuenta.strip() or not data.nip.strip():
        return {"success": False, "message": "El número de cuenta/empleado y el NIP son obligatorios."}

    try:
        conexion = conectarbd()
        cursor = conexion.cursor(dictionary=True)

        # ==========================================
        #  2. INTENTAR COMO PROFESOR (Con NIP)
        # ==========================================
        cursor.execute(
            "SELECT no_empleado, nombre_profesor, correo FROM Profesores WHERE no_empleado = %s AND nip = %s",
            (data.no_cuenta, data.nip)
        )
        profesor = cursor.fetchone()

        if profesor:
            cursor.execute(
                """
                SELECT m.codigo_materia, m.nombre_materia
                FROM Profesor_Materia pm
                         JOIN Materias m ON pm.id_materia = m.codigo_materia
                WHERE pm.id_profesor = %s
                """,
                (data.no_cuenta,)
            )
            materias = cursor.fetchall()
            cursor.close()
            conexion.close()

            return {
                "success": True,
                "tipo": "profesor",
                "usuario": {
                    "no_empleado": profesor["no_empleado"],
                    "nombre_profesor": profesor["nombre_profesor"],
                    "correo": profesor.get("correo"),
                    "materias": materias
                }
            }

        # ==========================================
        #  3. INTENTAR COMO ALUMNO (Con NIP)
        # ==========================================
        cursor.execute(
            "SELECT no_cuenta, nombres, apellido_paterno, apellido_materno, grupo, grado, carrera, foto, nip FROM Alumnos WHERE no_cuenta = %s AND nip = %s",
            (data.no_cuenta, data.nip)
        )
        alumno = cursor.fetchone()

        if not alumno:
            cursor.execute("SELECT nip FROM Alumnos WHERE no_cuenta = %s", (data.no_cuenta,))
            existe_alumno = cursor.fetchone()

            cursor.close()
            conexion.close()

            if existe_alumno and not existe_alumno.get("nip"):
                return {"success": False, "message": "Aún no tienes NIP. Usa la opción 'Registrar NIP' primero."}

            return {"success": False, "message": "Credenciales incorrectas. Verifica tu número y NIP."}

        cursor.execute(
            """
            SELECT m.codigo_materia, m.nombre_materia
            FROM Alumno_Materia am
                     JOIN Materias m ON am.id_materia = m.codigo_materia
            WHERE am.id_alumno = %s
            """,
            (data.no_cuenta,)
        )
        materias = cursor.fetchall()
        cursor.close()
        conexion.close()

        nombre_completo = (
            f"{alumno.get('nombres', '')} "
            f"{alumno.get('apellido_paterno', '')} "
            f"{alumno.get('apellido_materno', '')}".strip()
        )

        return {
            "success": True,
            "tipo": "alumno",
            "usuario": {
                "id": str(alumno["no_cuenta"]),
                "no_cuenta": str(alumno["no_cuenta"]),
                "nombre": nombre_completo,
                "foto_url": f"/fotos/{alumno['foto']}" if alumno.get("foto") else None,
                "grupo": alumno.get("grupo"),
                "grado": alumno.get("grado"),
                "carrera": alumno.get("carrera"),
                "materias": materias
            }
        }

    except Exception as error:
        print(f"[login_universal] Error: {error}")
        return {"success": False, "message": "Error interno del servidor"}


@app.post("/usuario/foto")
def subir_foto(usuario_id: str = Form(...), foto: UploadFile = File(...)):
    """Sube, almacena físicamente y vincula la foto de perfil de un alumno en la BD."""
    try:
        extension = foto.filename.split(".")[-1]
        nombre_archivo = f"{usuario_id}.{extension}"
        ruta_archivo = f"fotos_alumnos/{nombre_archivo}"

        with open(ruta_archivo, "wb+") as file_object:
            shutil.copyfileobj(foto.file, file_object)

        conexion = conectarbd()
        cursor = conexion.cursor()
        cursor.execute(
            "UPDATE Alumnos SET foto = %s WHERE no_cuenta = %s",
            (nombre_archivo, usuario_id)
        )
        conexion.commit()
        cursor.close()
        conexion.close()

        return {
            "success": True,
            "message": "Foto guardada exitosamente",
            "foto_url": f"/fotos/{nombre_archivo}"
        }

    except Exception as e:
        print(f"[subir_foto] Error: {e}")
        return {"success": False, "message": "Error al procesar la imagen"}


# ─────────────────────────────────────────────
#  ESP32 / PROCESAMIENTO DE ASISTENCIA
# ─────────────────────────────────────────────

def _calcular_asistencia_sesion(cursor, id_sesion: int) -> dict:
    cursor.execute(
        "SELECT codigo_materia FROM Sesiones_Clase WHERE id_sesion = %s",
        (id_sesion,)
    )
    codigo_materia = cursor.fetchone()["codigo_materia"]

    cursor.execute(
        """
        SELECT no_cuenta, COUNT(*) AS total_logs
        FROM Logs_Bluetooth
        WHERE id_sesion = %s
        GROUP BY no_cuenta
        """,
        (id_sesion,)
    )
    logs_por_alumno = {row["no_cuenta"]: row["total_logs"] for row in cursor.fetchall()}

    max_logs = max(logs_por_alumno.values(), default=0)

    if max_logs == 0:
        margen = 0
        min_para_presente = 1
    else:
        margen = 2 if max_logs <= 10 else 3
        min_para_presente = max(1, max_logs - margen)

    hora = datetime.now().strftime("%H:%M:%S")
    print(f"[{hora}] Cálculo Sesión {id_sesion} — max_logs={max_logs}, margen={margen}, min_presente={min_para_presente}")

    cursor.execute(
        "SELECT id_alumno FROM Alumno_Materia WHERE id_materia = %s",
        (codigo_materia,)
    )
    todos_los_alumnos = [row["id_alumno"] for row in cursor.fetchall()]

    contadores = {"presentes": 0, "dudosos": 0, "ausentes": 0}

    for no_cuenta in todos_los_alumnos:
        cursor.execute("SELECT id_asistencia, estado FROM Asistencia WHERE id_alumno = %s AND id_sesion = %s",
                       (no_cuenta, id_sesion))
        existente = cursor.fetchone()

        if existente and existente["estado"] == "PRESENTE":
            contadores["presentes"] += 1
            print(f"[{hora}] [{id_sesion}] {no_cuenta} → PRESENTE (Pase por Cámara)")
            continue

        logs = logs_por_alumno.get(no_cuenta, 0)

        if logs >= min_para_presente:
            estado = "PRESENTE"
            contadores["presentes"] += 1
        elif logs > 0:
            estado = "DUDOSO"
            contadores["dudosos"] += 1
        else:
            estado = "AUSENTE"
            contadores["ausentes"] += 1

        if existente:
            cursor.execute("UPDATE Asistencia SET estado = %s WHERE id_asistencia = %s",
                           (estado, existente["id_asistencia"]))
        else:
            cursor.execute("INSERT INTO Asistencia (id_alumno, id_sesion, estado) VALUES (%s, %s, %s)",
                           (no_cuenta, id_sesion, estado))

        print(f"[{hora}] [{id_sesion}] {no_cuenta} → {estado} ({logs}/{max_logs} logs)")

    contadores["max_logs"] = max_logs
    contadores["min_para_presente"] = min_para_presente
    contadores["margen_usado"] = margen
    return contadores


@app.post("/iniciar_clase")
def iniciar_clase(clase: InicioClase):
    try:
        conexion = conectarbd()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("SELECT no_empleado, nombre_profesor FROM Profesores WHERE no_empleado = %s",
                       (clase.no_empleado,))
        profesor = cursor.fetchone()
        if not profesor:
            cursor.close()
            conexion.close()
            raise HTTPException(status_code=404, detail="Profesor no encontrado")

        cursor.execute("SELECT codigo_materia, nombre_materia FROM Materias WHERE codigo_materia = %s",
                       (clase.codigo_materia,))
        materia = cursor.fetchone()
        if not materia:
            cursor.close()
            conexion.close()
            raise HTTPException(status_code=404, detail="Materia no encontrada")

        cursor.execute("SELECT 1 FROM Profesor_Materia WHERE id_profesor = %s AND id_materia = %s",
                       (clase.no_empleado, clase.codigo_materia))
        if not cursor.fetchone():
            cursor.close()
            conexion.close()
            raise HTTPException(
                status_code=403,
                detail=f"El profesor {profesor['nombre_profesor']} no imparte {materia['nombre_materia']}"
            )

        cursor.execute("UPDATE Sesiones_Clase SET estado = 'FINALIZADA', fecha_fin = NOW() WHERE estado = 'ACTIVA'")

        cursor.execute("INSERT INTO Sesiones_Clase (no_empleado, codigo_materia, estado) VALUES (%s, %s, 'ACTIVA')",
                       (clase.no_empleado, clase.codigo_materia))
        conexion.commit()
        id_nueva_sesion = cursor.lastrowid

        cursor.close()
        conexion.close()

        print(f"[{datetime.now().strftime('%H:%M:%S')}] Sesión {id_nueva_sesion} iniciada: {materia['nombre_materia']}")

        return {
            "status": "success",
            "message": f"Clase '{materia['nombre_materia']}' iniciada.",
            "id_sesion": id_nueva_sesion,
            "profesor": profesor["nombre_profesor"],
            "materia": materia["nombre_materia"]
        }

    except HTTPException:
        raise
    except mysql.connector.Error as error:
        raise HTTPException(status_code=500, detail=f"Error en BD: {error}")


@app.post("/finalizar_clase")
def finalizar_clase(data: FinClase):
    try:
        conexion = conectarbd()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute(
            "SELECT id_sesion, codigo_materia FROM Sesiones_Clase WHERE estado = 'ACTIVA' AND no_empleado = %s LIMIT 1",
            (data.no_empleado,))
        sesion = cursor.fetchone()

        if not sesion:
            cursor.close()
            conexion.close()
            return {"status": "error", "message": "No tienes ninguna sesión activa"}

        id_sesion = sesion["id_sesion"]

        cursor.execute("UPDATE Sesiones_Clase SET estado = 'FINALIZADA', fecha_fin = NOW() WHERE id_sesion = %s",
                       (id_sesion,))

        contadores = _calcular_asistencia_sesion(cursor, id_sesion)

        conexion.commit()
        cursor.close()
        conexion.close()

        return {
            "status": "success",
            "message": "Clase finalizada y asistencia calculada",
            "id_sesion": id_sesion,
            "resumen": contadores
        }

    except mysql.connector.Error as error:
        raise HTTPException(status_code=500, detail=f"Error en BD: {error}")


@app.get("/estado_clase")
def estado_clase():
    """Retorna los datos de la sesión activa para el setup() y refresco del ESP32 con soporte de Logs."""
    global log_camara
    try:
        conexion = conectarbd()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT sc.id_sesion, sc.codigo_materia, m.nombre_materia, p.nombre_profesor
            FROM Sesiones_Clase sc
                     JOIN Materias m ON sc.codigo_materia = m.codigo_materia
                     JOIN Profesores p ON sc.no_empleado = p.no_empleado
            WHERE sc.estado = 'ACTIVA' LIMIT 1
            """
        )
        sesion = cursor.fetchone()

        if not sesion:
            cursor.close()
            conexion.close()
            return {"status": "inactive", "materia": "Sin clase", "nombre_materia": "", "total": 0, "log": "Esperando clase"}

        cursor.execute("SELECT COUNT(DISTINCT no_cuenta) as total FROM Logs_Bluetooth WHERE id_sesion = %s",
                       (sesion["id_sesion"],))
        total = cursor.fetchone()["total"]

        cursor.close()
        conexion.close()

        return {
            "status": "active",
            "id_sesion": sesion["id_sesion"],
            "materia": sesion["codigo_materia"],
            "nombre_materia": sesion["nombre_materia"],
            "profesor": sesion["nombre_profesor"],
            "total": total,
            "log": log_camara  # <-- ENVÍA LA ENTRADA DE LOG CRUCIAL
        }

    except Exception as e:
        print(f"[estado_clase] Error: {e}")
        return {"status": "error", "materia": "Error BD", "total": 0, "log": "Error BD"}


@app.post("/asistencia")
def registrar_asistencia(registro: RegistroAsistencia):
    try:
        if not registro.id_alumno.isdigit():
            return {"status": "error", "mensaje": "Señal ignorada, no es una cuenta"}

        conexion = conectarbd()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT sc.id_sesion,
                   sc.codigo_materia,
                   m.nombre_materia
            FROM Sesiones_Clase sc
                     JOIN Materias m
                          ON sc.codigo_materia = m.codigo_materia
            WHERE sc.estado = 'ACTIVA' LIMIT 1
            """
        )
        sesion = cursor.fetchone()

        if not sesion:
            cursor.close()
            conexion.close()
            return {"status": "error", "mensaje": "No hay sesión activa"}

        id_sesion = sesion["id_sesion"]
        codigo_materia = sesion["codigo_materia"]
        nombre_materia = sesion["nombre_materia"]

        cursor.execute("SELECT no_cuenta FROM Alumnos WHERE no_cuenta = %s", (registro.id_alumno,))
        alumno = cursor.fetchone()

        if not alumno:
            cursor.close()
            conexion.close()
            return {"status": "error", "mensaje": "Alumno no existe"}

        no_cuenta = alumno["no_cuenta"]

        cursor.execute("SELECT 1 FROM Alumno_Materia WHERE id_alumno = %s AND id_materia = %s",
                       (no_cuenta, codigo_materia))
        if not cursor.fetchone():
            cursor.close()
            conexion.close()
            return {"status": "error", "mensaje": "Alumno no inscrito en esta materia"}

        cursor.execute("INSERT INTO Logs_Bluetooth (id_sesion, no_cuenta, fuente) VALUES (%s, %s, 'ESP32')",
                       (id_sesion, no_cuenta))
        conexion.commit()

        cursor.execute("SELECT COUNT(*) AS total_logs FROM Logs_Bluetooth WHERE id_sesion = %s AND no_cuenta = %s",
                       (id_sesion, no_cuenta))
        total_logs_alumno = cursor.fetchone()["total_logs"]

        cursor.execute("SELECT COUNT(DISTINCT no_cuenta) AS detectados FROM Logs_Bluetooth WHERE id_sesion = %s",
                       (id_sesion,))
        detectados = cursor.fetchone()["detectados"]

        cursor.execute(
            "SELECT COUNT(*) AS total FROM Logs_Bluetooth WHERE id_sesion = %s GROUP BY no_cuenta ORDER BY total DESC LIMIT 1",
            (id_sesion,))
        max_row = cursor.fetchone()
        current_max = max_row["total"] if max_row else 0
        current_margin = 2 if current_max <= 10 else 3
        estimated_min_para_presente = max(1, current_max - current_margin)

        cursor.close()
        conexion.close()

        return {
            "status": "success",
            "materia": codigo_materia,
            "nombre_materia": nombre_materia,
            "logs_alumno": total_logs_alumno,
            "detectados": detectados,
            "minimo_para_presente": estimated_min_para_presente
        }

    except mysql.connector.Error as error:
        print(f"[MYSQL ERROR] {error}")
        raise HTTPException(status_code=500, detail=str(error))


@app.post("/recalcular_asistencia/{id_sesion}")
def recalcular_asistencia(id_sesion: int):
    try:
        conexion = conectarbd()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("SELECT estado FROM Sesiones_Clase WHERE id_sesion = %s", (id_sesion,))
        if not cursor.fetchone():
            cursor.close()
            conexion.close()
            raise HTTPException(status_code=404, detail="Sesión no encontrada")

        contadores = _calcular_asistencia_sesion(cursor, id_sesion)
        conexion.commit()
        cursor.close()
        conexion.close()

        return {"status": "success", "id_sesion": id_sesion, "resumen": contadores}
    except HTTPException:
        raise
    except mysql.connector.Error as error:
        raise HTTPException(status_code=500, detail=f"Error en BD: {error}")


@app.post("/asistencia_visual")
async def asistencia_visual(foto: UploadFile = File(...)):
    """
    Recibe la foto manual del ESP32, la valida con el contenedor de IA,
    y guarda la respuesta del handshake en la pizarra virtual global para la OLED.
    """
    global log_camara
    try:
        import requests

        contenido_foto = await foto.read()

        url_ia = "http://face_recognition:5001/comparar"
        archivos = {"foto": (foto.filename, contenido_foto, foto.content_type)}

        try:
            respuesta_ia = requests.post(url_ia, files=archivos)
        except requests.exceptions.ConnectionError:
            log_camara = "Error: IA Offline"
            return {"status": "error", "mensaje": "El contenedor 'face_recognition' está apagado o no responde."}

        if respuesta_ia.status_code != 200:
            log_camara = "Error Interno IA"
            return {"status": "error", "mensaje": f"La IA crasheó internamente (HTTP {respuesta_ia.status_code})."}

        datos_ia = respuesta_ia.json()

        # Captura y formateo de fallas según el app.py de la IA
        if datos_ia.get("status") == "error":
            if "No se detecto rostro" in datos_ia.get("message", ""):
                log_camara = "Rostro no detectado"
            else:
                log_camara = "Carpeta sin fotos"
            return {"status": "error", "mensaje": datos_ia.get("message")}

        if datos_ia.get("status") == "unknown":
            log_camara = "Alumno no registrado"
            return {"status": "error", "mensaje": "Alumno no reconocido"}

        no_cuenta = datos_ia["no_cuenta"]

        conexion = conectarbd()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("SELECT id_sesion FROM Sesiones_Clase WHERE estado = 'ACTIVA' LIMIT 1")
        sesion = cursor.fetchone()

        if not sesion:
            cursor.close()
            conexion.close()
            log_camara = "No hay clase activa"
            return {"status": "error", "mensaje": f"Rostro {no_cuenta} detectado, pero no hay clase activa"}

        id_sesion = sesion["id_sesion"]

        cursor.execute("SELECT id_asistencia FROM Asistencia WHERE id_alumno = %s AND id_sesion = %s",
                       (no_cuenta, id_sesion))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO Asistencia (id_alumno, id_sesion, estado) VALUES (%s, %s, 'PRESENTE')",
                           (no_cuenta, id_sesion))

            cursor.execute("INSERT INTO Logs_Bluetooth (id_sesion, no_cuenta, fuente) VALUES (%s, %s, 'ESP32')",
                           (id_sesion, no_cuenta))
            conexion.commit()

        cursor.close()
        conexion.close()

        # ÉXITO: Publicamos el alumno registrado en la pizarra global
        log_camara = f"Asistencia: {no_cuenta}"
        print(f"[CÁMARA] Asistencia manual registrada para: {no_cuenta}")

        return {
            "status": "success",
            "mensaje": "Asistencia por rostro OK",
            "no_cuenta": no_cuenta
        }

    except Exception as e:
        import traceback
        print(f"[ERROR CRITICO] {traceback.format_exc()}")
        log_camara = "Error de Servidor"
        return {"status": "error", "mensaje": f"Fallo interno: {str(e)}"}


# ─────────────────────────────────────────────
#  NUEVOS ENDPOINTS PARA EL DASHBOARD DE PROFESOR
# ─────────────────────────────────────────────

@app.get("/alumnos/{codigo_materia}")
def obtener_alumnos_materia(codigo_materia: str):
    try:
        conexion = conectarbd()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                a.no_cuenta,
                a.nombres,
                a.apellido_paterno,
                a.apellido_materno,
                a.grupo,
                a.grado,
                a.carrera,
                a.foto
            FROM Alumno_Materia am
            JOIN Alumnos a ON am.id_alumno = a.no_cuenta
            WHERE am.id_materia = %s
            ORDER BY a.apellido_paterno, a.apellido_materno, a.nombres
        """, (codigo_materia,))
        alumnos = cursor.fetchall()

        cursor.close()
        conexion.close()

        result = []
        for al in alumnos:
            nombre = f"{al.get('nombres','')} {al.get('apellido_paterno','')} {al.get('apellido_materno','')}".strip()
            result.append({
                "no_cuenta": str(al["no_cuenta"]),
                "nombre": nombre,
                "grupo": al.get("grupo"),
                "grado": al.get("grado"),
                "carrera": al.get("carrera"),
                "foto_url": f"/fotos/{al['foto']}" if al.get("foto") else None,
            })

        return {"success": True, "alumnos": result}

    except Exception as e:
        print(f"[obtener_alumnos_materia] Error: {e}")
        return {"success": False, "message": "Error al obtener alumnos", "alumnos": []}


@app.get("/alumnos_activos/{id_sesion}")
def obtener_alumnos_activos(id_sesion: int):
    try:
        conexion = conectarbd()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("SELECT id_sesion, codigo_materia FROM Sesiones_Clase WHERE id_sesion = %s", (id_sesion,))
        sesion = cursor.fetchone()
        if not sesion:
            cursor.close()
            conexion.close()
            return {"success": False, "message": "Sesión no encontrada", "alumnos_activos": []}

        cursor.execute("""
            SELECT
                lb.no_cuenta,
                COUNT(*) AS total_logs,
                MAX(lb.timestamp) AS ultima_deteccion,
                a.nombres,
                a.apellido_paterno,
                a.apellido_materno,
                a.grupo,
                a.grado,
                a.carrera
            FROM Logs_Bluetooth lb
            JOIN Alumnos a ON lb.no_cuenta = a.no_cuenta
            WHERE lb.id_sesion = %s
            GROUP BY lb.no_cuenta, a.nombres, a.apellido_paterno, a.apellido_materno, a.grupo, a.grado, a.carrera
            ORDER BY ultima_deteccion DESC
        """, (id_sesion,))
        activos = cursor.fetchall()

        cursor.execute("""
            SELECT COUNT(*) AS total FROM Logs_Bluetooth
            WHERE id_sesion = %s
            GROUP BY no_cuenta
            ORDER BY total DESC LIMIT 1
        """, (id_sesion,))
        max_row = cursor.fetchone()
        max_logs = max_row["total"] if max_row else 0
        margen = 2 if max_logs <= 10 else 3
        min_para_presente = max(1, max_logs - margen)

        cursor.close()
        conexion.close()

        ahora = datetime.now()
        result = []
        for al in activos:
            nombre = f"{al.get('nombres','')} {al.get('apellido_paterno','')} {al.get('apellido_materno','')}".strip()
            ultima = al["ultima_deteccion"]
            segundos_desde_ultima = (ahora - ultima).total_seconds() if ultima else 9999

            if segundos_desde_ultima <= 30:
                estado_rt = "online"
            elif segundos_desde_ultima <= 120:
                estado_rt = "idle"
            else:
                estado_rt = "offline"

            result.append({
                "no_cuenta": str(al["no_cuenta"]),
                "nombre": nombre,
                "grupo": al.get("grupo"),
                "grado": al.get("grado"),
                "carrera": al.get("carrera"),
                "total_logs": al["total_logs"],
                "ultima_deteccion": ultima.isoformat() if ultima else None,
                "segundos_inactivo": round(segundos_desde_ultima),
                "estado_rt": estado_rt,
                "proyeccion": "PRESENTE" if al["total_logs"] >= min_para_presente else ("DUDOSO" if al["total_logs"] > 0 else "AUSENTE"),
            })

        return {
            "success": True,
            "id_sesion": id_sesion,
            "total_detectados": len(result),
            "min_para_presente": min_para_presente,
            "alumnos_activos": result
        }

    except Exception as e:
        print(f"[obtener_alumnos_activos] Error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "message": "Error al obtener alumnos activos", "alumnos_activos": []}