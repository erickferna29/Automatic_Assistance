import mysql.connector
import requests
from fastapi import HTTPException, FastAPI, UploadFile, File
from pydantic import BaseModel
from datetime import datetime
app = FastAPI()

class RegistroAsistencia(BaseModel):
    id_alumno : int

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
    return {"status": "online" ,"message": "Servidor de asistencia listo"}

@app.post("/iniciar_clase")
def iniciar_clase(clase: InicioClase):
    try:
        conexion = conectarbd()
        cursor = conexion.cursor()

        cursor.execute("UPDATE Sesiones_Activas SET estado = 'cerrada' WHERE estado = 'abierta'")

        sql = "INSERT INTO Sesiones_Activas (no_empleado, codigo_materia, estado) VALUES (%s, %s, 'abierta')"
        cursor.execute(sql, (clase.no_empleado, clase.codigo_materia))
        conexion.commit()
        conexion.close()

        return {"status": "success", "message": f"Clase {clase.codigo_materia} iniciada."}
    except mysql.connector.Error as error:
        raise HTTPException(status_code=500, detail=f"Error en BD{error}")
@app.post("/asistencia")
def registrar_asistencia(registro: RegistroAsistencia):
    try:
        conexion = conectarbd()
        cursor = conexion.cursor()

        cursor.execute("SELECT codigo_materia FROM Sesiones_Activas WHERE estado = 'abierta' LIMIT 1")
        sesion_actual = cursor.fetchone()

        if not sesion_actual:
            # Si no hay clase abierta, ignoramos la señal
            print(f"Señal de {registro.id_alumno} ignorada: No hay ninguna clase abierta.")
            return {"status": "ignored", "mensaje": "No hay sesión activa"}

        materia_activa = sesion_actual[0]

        sql = "INSERT INTO Asistencia (id_alumno, codigo_materia) VALUES (%s, %s)"
        cursor.execute(sql, (registro.id_alumno, materia_activa))
        conexion.commit()

        hora = datetime.now().strftime("%H:%M:%S")
        print(f"[{hora}] Asistencia registrada: Alumno {registro.id_alumno} en clase {materia_activa}")

        return {"status": "success", "message": "Asistencia registrada en db"}
    except mysql.connector.Error as error:
        print(f"Error de Base de datos: {error}")
        raise HTTPException(status_code=500, detail="Error interno al intentar guardar en db")


@app.post("/asistencia_visual")
async def asistencia_visual(foto: UploadFile = File(...)):
    try:
        # 1. Mandamos la foto al contenedor de reconocimiento facial (usando el nombre del servicio en Docker)
        url_ia_docker = "http://face_recognition:5001/comparar"
        archivos = {'foto': (foto.filename, foto.file, foto.content_type)}

        respuesta_ia = requests.post(url_ia_docker, files=archivos)
        resultado = respuesta_ia.json()

        # 2. Si la IA no reconoció a nadie
        if resultado.get("status") != "success":
            return {"status": "error", "mensaje": resultado.get("message")}

        # 3. ¡Rostro reconocido!
        no_cuenta = int(resultado["no_cuenta"])
        print(f"👁️ ¡Rostro reconocido! Alumno: {no_cuenta}")

        # 4. Registrar en MariaDB usando la clase abierta
        conexion = conectarbd()
        cursor = conexion.cursor()

        cursor.execute("SELECT codigo_materia FROM Sesiones_Activas WHERE estado = 'abierta' LIMIT 1")
        sesion_actual = cursor.fetchone()

        if not sesion_actual:
            return {"status": "ignored", "mensaje": "Alumno reconocido, pero no hay sesión activa"}

        materia_activa = sesion_actual[0]

        sql = "INSERT INTO Asistencia (id_alumno, codigo_materia) VALUES (%s, %s)"
        cursor.execute(sql, (no_cuenta, materia_activa))
        conexion.commit()
        conexion.close()

        hora = datetime.now().strftime("%H:%M:%S")
        print(f"[{hora}] ✅ Asistencia Visual guardada: Alumno {no_cuenta} en clase {materia_activa}")

        return {"status": "success", "mensaje": "Asistencia visual registrada en db"}

    except Exception as e:
        print(f"❌ Error en asistencia visual: {e}")
        raise HTTPException(status_code=500, detail="Error interno al procesar imagen")