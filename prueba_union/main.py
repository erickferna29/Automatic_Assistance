import mysql.connector
import requests
import shutil
import os
from fastapi import HTTPException, FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()


class LoginData(BaseModel):
    no_cuenta: str
    nip: str


class RegistroAsistencia(BaseModel):
    id_alumno: str  # Cambiado a String para poder recibir y filtrar basura bluetooth


class InicioClase(BaseModel):
    no_empleado: str
    codigo_materia: str


def conectarbd():
    return mysql.connector.connect(
        host="db_asistencia",
        user="root",
        password="1234",
        database="Automatic_Asistance"
    )


@app.get("/")
def inicio():
    return {"status": "online", "message": "Servidor de asistencia listo"}


# --- ENDPOINTS APP MÓVIL ---
@app.post("/auth/login")
def login_usuario(data: LoginData):
    try:
        conexion = conectarbd()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Alumnos WHERE no_cuenta = %s AND nip = %s", (data.no_cuenta, data.nip))
        usuario = cursor.fetchone()
        cursor.close()
        conexion.close()

        if usuario:
            nombre_completo = f"{usuario.get('nombres', '')} {usuario.get('apellido_paterno', '')} {usuario.get('apellido_materno', '')}".strip()
            return {
                "success": True,
                "usuario": {
                    "id": str(usuario["no_cuenta"]),
                    "no_cuenta": str(usuario["no_cuenta"]),
                    "nombre": nombre_completo,
                    "foto_url": usuario.get("foto")
                }
            }
        return {"success": False, "message": "Número de cuenta o NIP incorrectos"}
    except Exception as error:
        return {"success": False, "message": "Error interno del servidor"}


@app.post("/usuario/foto")
def subir_foto(usuario_id: str = Form(...), foto: UploadFile = File(...)):
    try:
        os.makedirs("fotos_alumnos", exist_ok=True)
        extension = foto.filename.split(".")[-1]
        nombre_archivo = f"{usuario_id}.{extension}"
        ruta_archivo = f"fotos_alumnos/{nombre_archivo}"

        with open(ruta_archivo, "wb+") as file_object:
            shutil.copyfileobj(foto.file, file_object)

        conexion = conectarbd()
        cursor = conexion.cursor()
        cursor.execute("UPDATE Alumnos SET foto = %s WHERE no_cuenta = %s", (nombre_archivo, usuario_id))
        conexion.commit()
        cursor.close()
        conexion.close()
        return {"success": True, "message": "Foto guardada exitosamente"}
    except Exception as e:
        return {"success": False, "message": "Error al procesar la imagen"}


# --- ENDPOINTS ESP32 ---

@app.post("/iniciar_clase")
def iniciar_clase(clase: InicioClase):
    try:
        conexion = conectarbd()
        cursor = conexion.cursor()
        cursor.execute("UPDATE Sesiones_Clase SET estado = 'FINALIZADA' WHERE estado = 'ACTIVA'")
        sql = "INSERT INTO Sesiones_Clase (no_empleado, codigo_materia, estado) VALUES (%s, %s, 'ACTIVA')"
        cursor.execute(sql, (clase.no_empleado, clase.codigo_materia))
        conexion.commit()
        conexion.close()
        return {"status": "success", "message": f"Clase {clase.codigo_materia} iniciada."}
    except mysql.connector.Error as error:
        raise HTTPException(status_code=500, detail=f"Error en BD: {error}")


@app.get("/estado_clase")
def estado_clase():
    try:
        conexion = conectarbd()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("SELECT id_sesion, codigo_materia FROM Sesiones_Clase WHERE estado = 'ACTIVA' LIMIT 1")
        sesion = cursor.fetchone()

        if not sesion:
            return {"status": "inactive", "materia": "Sin clase", "total": 0}

        cursor.execute("SELECT COUNT(*) as total FROM Asistencia WHERE id_sesion = %s", (sesion['id_sesion'],))
        total = cursor.fetchone()['total']

        cursor.close()
        conexion.close()
        return {"status": "active", "materia": sesion['codigo_materia'], "total": total}
    except Exception as e:
        return {"status": "error", "materia": "Error BD", "total": 0}


@app.post("/asistencia")
def registrar_asistencia(registro: RegistroAsistencia):
    try:
        # 1. Filtro Anti-Basura Bluetooth (rechazar si tiene letras)
        if not registro.id_alumno.isdigit():
            return {"status": "error", "mensaje": "Señal ignorada, no es una cuenta"}

        conexion = conectarbd()
        cursor = conexion.cursor(dictionary=True)

        # 2. Verificar clase activa
        cursor.execute("SELECT id_sesion, codigo_materia FROM Sesiones_Clase WHERE estado = 'ACTIVA' LIMIT 1")
        sesion = cursor.fetchone()

        if not sesion:
            return {"status": "error", "mensaje": "No hay sesión activa"}

        id_sesion = sesion['id_sesion']
        materia = sesion['codigo_materia']

        # 3. Verificar que el alumno exista en la BD
        cursor.execute("SELECT no_cuenta FROM Alumnos WHERE no_cuenta = %s", (registro.id_alumno,))
        alumno = cursor.fetchone()

        if not alumno:
            print(f"Intento bloqueado: {registro.id_alumno} no existe en la BD.")
            return {"status": "error", "mensaje": "Alumno no existe"}

        no_cuenta = alumno['no_cuenta']

        # 4. Registrar en Logs_Bluetooth
        cursor.execute("INSERT INTO Logs_Bluetooth (id_sesion, no_cuenta, fuente) VALUES (%s, %s, 'ESP32')",
                       (id_sesion, no_cuenta))

        # 5. Registrar Asistencia (Evitando duplicados en la misma clase)
        cursor.execute("SELECT id_asistencia FROM Asistencia WHERE id_alumno = %s AND id_sesion = %s",
                       (no_cuenta, id_sesion))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO Asistencia (id_alumno, id_sesion, estado) VALUES (%s, %s, 'PRESENTE')",
                           (no_cuenta, id_sesion))

        conexion.commit()

        # 6. Contar totales para la pantalla OLED
        cursor.execute("SELECT COUNT(*) as total FROM Asistencia WHERE id_sesion = %s", (id_sesion,))
        total = cursor.fetchone()['total']

        cursor.close()
        conexion.close()

        hora = datetime.now().strftime("%H:%M:%S")
        print(f"[{hora}] Asistencia registrada (BLE): {no_cuenta} en {materia} | Total: {total}")

        # Retornamos los datos limpios al ESP32
        return {"status": "success", "materia": materia, "total": total}

    except mysql.connector.Error as error:
        raise HTTPException(status_code=500, detail="Error interno de BD")


@app.post("/asistencia_visual")
async def asistencia_visual(foto: UploadFile = File(...)):
    # ... (Misma lógica pero omitida por brevedad si no modificamos esto ahora)
    return {"status": "success", "mensaje": "Pendiente integrar IA y pantalla"}