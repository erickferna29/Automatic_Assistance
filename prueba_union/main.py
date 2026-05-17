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
#  MODELOS
# ─────────────────────────────────────────────

class LoginData(BaseModel):
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
#  APP MÓVIL / FOTOS
# ─────────────────────────────────────────────

@app.post("/auth/login")
def login_usuario(data: LoginData):
    """
    Autentica al alumno con no_cuenta + nip.
    Devuelve sus datos y la lista de materias en las que está inscrito.
    """
    try:
        conexion = conectarbd()
        cursor = conexion.cursor(dictionary=True)

        # 1. Verificar credenciales
        cursor.execute(
            "SELECT * FROM Alumnos WHERE no_cuenta = %s AND nip = %s",
            (data.no_cuenta, data.nip)
        )
        usuario = cursor.fetchone()

        if not usuario:
            cursor.close()
            conexion.close()
            return {"success": False, "message": "Número de cuenta o NIP incorrectos"}

        # 2. Obtener materias inscritas (Alumno_Materia → Materias)
        cursor.execute(
            """
            SELECT m.codigo_materia, m.nombre_materia
            FROM Alumno_Materia am
                     JOIN Materias m ON am.id_materia = m.codigo_materia
            WHERE am.id_alumno = %s
            """,
            (usuario["no_cuenta"],)
        )
        materias = cursor.fetchall()

        cursor.close()
        conexion.close()

        nombre_completo = (
            f"{usuario.get('nombres', '')} "
            f"{usuario.get('apellido_paterno', '')} "
            f"{usuario.get('apellido_materno', '')}".strip()
        )

        return {
            "success": True,
            "usuario": {
                "id": str(usuario["no_cuenta"]),
                "no_cuenta": str(usuario["no_cuenta"]),
                "nombre": nombre_completo,
                "foto_url": f"/fotos/{usuario.get('foto')}" if usuario.get('foto') else None,
                "grupo": usuario.get("grupo"),
                "grado": usuario.get("grado"),
                "materias": materias
            }
        }

    except Exception as error:
        print(f"[login] Error: {error}")
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
    """
    Calcula la asistencia final usando el umbral dinámico basado en logs:
      - max_logs = logs acumulados por el alumno más detectado (pico real de la sesión)
      - margen   = 2 si max_logs <= 10, o 3 si max_logs > 10
      - min_para_presente = max_logs - margen (mínimo 1)
    """
    # 1. Obtener materia de la sesión
    cursor.execute(
        "SELECT codigo_materia FROM Sesiones_Clase WHERE id_sesion = %s",
        (id_sesion,)
    )
    codigo_materia = cursor.fetchone()["codigo_materia"]

    # 2. Obtener conteo de logs por alumno en esta sesión
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

    # 3. Determinar el valor máximo registrado
    max_logs = max(logs_por_alumno.values(), default=0)

    if max_logs == 0:
        margen = 0
        min_para_presente = 1
    else:
        margen = 2 if max_logs <= 10 else 3
        min_para_presente = max(1, max_logs - margen)

    hora = datetime.now().strftime("%H:%M:%S")
    print(
        f"[{hora}] Cálculo Sesión {id_sesion} — max_logs={max_logs}, margen={margen}, min_presente={min_para_presente}")

    # 4. Traer todos los alumnos inscritos para evaluar estados individuales
    cursor.execute(
        "SELECT id_alumno FROM Alumno_Materia WHERE id_materia = %s",
        (codigo_materia,)
    )
    todos_los_alumnos = [row["id_alumno"] for row in cursor.fetchall()]

    contadores = {"presentes": 0, "dudosos": 0, "ausentes": 0}

    for no_cuenta in todos_los_alumnos:
        # Verificar si ya tiene asistencia manual/cámara
        cursor.execute("SELECT id_asistencia, estado FROM Asistencia WHERE id_alumno = %s AND id_sesion = %s",
                       (no_cuenta, id_sesion))
        existente = cursor.fetchone()

        # Si ya existe y es PRESENTE (pase VIP por cámara), lo respetamos y saltamos el cálculo
        if existente and existente["estado"] == "PRESENTE":
            contadores["presentes"] += 1
            print(f"[{hora}] [{id_sesion}] {no_cuenta} → PRESENTE (Pase por Cámara)")
            continue

        # Si no tiene pase por cámara, procedemos al cálculo normal de Bluetooth
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

        # INSERT o UPDATE en Asistencia para los de Bluetooth
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

        # 1. Validar Profesor
        cursor.execute("SELECT no_empleado, nombre_profesor FROM Profesores WHERE no_empleado = %s",
                       (clase.no_empleado,))
        profesor = cursor.fetchone()
        if not profesor:
            cursor.close()
            conexion.close()
            raise HTTPException(status_code=404, detail="Profesor no encontrado")

        # 2. Validar Materia
        cursor.execute("SELECT codigo_materia, nombre_materia FROM Materias WHERE codigo_materia = %s",
                       (clase.codigo_materia,))
        materia = cursor.fetchone()
        if not materia:
            cursor.close()
            conexion.close()
            raise HTTPException(status_code=404, detail="Materia no encontrada")

        # 3. Validar Relación Profesor_Materia
        cursor.execute("SELECT 1 FROM Profesor_Materia WHERE id_profesor = %s AND id_materia = %s",
                       (clase.no_empleado, clase.codigo_materia))
        if not cursor.fetchone():
            cursor.close()
            conexion.close()
            raise HTTPException(
                status_code=403,
                detail=f"El profesor {profesor['nombre_profesor']} no imparte {materia['nombre_materia']}"
            )

        # 4. Limpiar sesiones anteriores activas
        cursor.execute("UPDATE Sesiones_Clase SET estado = 'FINALIZADA', fecha_fin = NOW() WHERE estado = 'ACTIVA'")

        # 5. Insertar nueva sesión
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

        # Cerrar sesión antes de procesar cálculos
        cursor.execute("UPDATE Sesiones_Clase SET estado = 'FINALIZADA', fecha_fin = NOW() WHERE id_sesion = %s",
                       (id_sesion,))

        # Ejecutar el cálculo dinámico de asistencias basado en repetición de logs
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
    """Retorna los datos de la sesión activa para el setup() y refresco del ESP32."""
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
            return {"status": "inactive", "materia": "Sin clase", "nombre_materia": "", "total": 0}

        # Contar alumnos únicos detectados mediante Logs_Bluetooth en tiempo real
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
            "total": total
        }

    except Exception as e:
        print(f"[estado_clase] Error: {e}")
        return {"status": "error", "materia": "Error BD", "total": 0}


@app.post("/asistencia")
def registrar_asistencia(registro: RegistroAsistencia):
    """Recibe la señal del radar del ESP32 e inserta filas en Logs_Bluetooth."""
    try:
        if not registro.id_alumno.isdigit():
            return {"status": "error", "mensaje": "Señal ignorada, no es una cuenta"}

        conexion = conectarbd()
        cursor = conexion.cursor(dictionary=True)

        # Verificar sesión activa
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

        # Validar existencia del Alumno
        cursor.execute("SELECT no_cuenta FROM Alumnos WHERE no_cuenta = %s", (registro.id_alumno,))
        alumno = cursor.fetchone()

        if not alumno:
            cursor.close()
            conexion.close()
            return {"status": "error", "mensaje": "Alumno no existe"}

        no_cuenta = alumno["no_cuenta"]

        # Validar si está inscrito
        cursor.execute("SELECT 1 FROM Alumno_Materia WHERE id_alumno = %s AND id_materia = %s",
                       (no_cuenta, codigo_materia))
        if not cursor.fetchone():
            cursor.close()
            conexion.close()
            return {"status": "error", "mensaje": "Alumno no inscrito en esta materia"}

        # Registrar Log de detección BLE
        cursor.execute("INSERT INTO Logs_Bluetooth (id_sesion, no_cuenta, fuente) VALUES (%s, %s, 'ESP32')",
                       (id_sesion, no_cuenta))
        conexion.commit()

        # Conteo de logs individuales actuales
        cursor.execute("SELECT COUNT(*) AS total_logs FROM Logs_Bluetooth WHERE id_sesion = %s AND no_cuenta = %s",
                       (id_sesion, no_cuenta))
        total_logs_alumno = cursor.fetchone()["total_logs"]

        # Conteo de alumnos únicos en la sesión actual
        cursor.execute("SELECT COUNT(DISTINCT no_cuenta) AS detectados FROM Logs_Bluetooth WHERE id_sesion = %s",
                       (id_sesion,))
        detectados = cursor.fetchone()["detectados"]

        # CORRECCIÓN DE CRASH: Calcular estimado de la mínima en tiempo real para evitar NameError en el ESP32
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
    y si coincide, le otorga la asistencia definitiva e inmediata.
    """
    try:
        # Importación segura aquí por si se te pasó ponerla al inicio del archivo
        import requests

        # 1. Leer los bytes asíncronos reales para que la foto no llegue vacía a la IA
        contenido_foto = await foto.read()

        # 2. Enviar foto al microservicio de IA en Docker
        url_ia = "http://face_recognition:5001/comparar"
        archivos = {"foto": (foto.filename, contenido_foto, foto.content_type)}

        try:
            respuesta_ia = requests.post(url_ia, files=archivos)
        except requests.exceptions.ConnectionError:
            return {"status": "error", "mensaje": "El contenedor 'face_recognition' está apagado o no responde."}

        if respuesta_ia.status_code != 200:
            return {"status": "error", "mensaje": f"La IA crasheó internamente (HTTP {respuesta_ia.status_code})."}

        datos_ia = respuesta_ia.json()

        # Si la IA no reconoce a nadie o falla su algoritmo
        if datos_ia.get("status") != "success":
            return {"status": "error", "mensaje": datos_ia.get("message", "Rostro no reconocido por la IA")}

        no_cuenta = datos_ia["no_cuenta"]

        # 3. IA exitosa: Guardar asistencia directa en la base de datos
        conexion = conectarbd()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("SELECT id_sesion FROM Sesiones_Clase WHERE estado = 'ACTIVA' LIMIT 1")
        sesion = cursor.fetchone()

        if not sesion:
            cursor.close()
            conexion.close()
            return {"status": "error", "mensaje": f"Rostro {no_cuenta} detectado, pero no hay clase activa"}

        id_sesion = sesion["id_sesion"]

        # Insertar asistencia DEFINITIVA (Pase VIP)
        cursor.execute("SELECT id_asistencia FROM Asistencia WHERE id_alumno = %s AND id_sesion = %s",
                       (no_cuenta, id_sesion))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO Asistencia (id_alumno, id_sesion, estado) VALUES (%s, %s, 'PRESENTE')",
                           (no_cuenta, id_sesion))

            # Log simbólico para que la pantallita OLED del ESP32 sume "+1" en Conectados
            cursor.execute("INSERT INTO Logs_Bluetooth (id_sesion, no_cuenta, fuente) VALUES (%s, %s, 'ESP32')",
                           (id_sesion, no_cuenta))
            conexion.commit()

        cursor.close()
        conexion.close()

        print(f"[CÁMARA] Asistencia manual registrada para: {no_cuenta}")

        return {
            "status": "success",
            "mensaje": "Asistencia por rostro OK",
            "no_cuenta": no_cuenta
        }

    except Exception as e:
        import traceback
        print(f"[ERROR CRITICO] {traceback.format_exc()}")
        # ¡Desenmascaramos el error! Ahora lo verás en la cajita negra de Swagger.
        return {"status": "error", "mensaje": f"Fallo interno: {str(e)}"}