from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import face_recognition
import os, shutil

app = FastAPI()
FOTOS_DIR = "/app/fotos_alumnos"

def cargar_encodings():
    conocidos = []
    if not os.path.exists(FOTOS_DIR):
        os.makedirs(FOTOS_DIR)
    for archivo in os.listdir(FOTOS_DIR):
        if archivo.endswith((".jpg", ".png")):
            ruta = os.path.join(FOTOS_DIR, archivo)
            img = face_recognition.load_image_file(ruta)
            encs = face_recognition.face_encodings(img)
            if encs:
                # El nombre del archivo debe ser el número de cuenta (ej: 123456.jpg)
                alumno_id = os.path.splitext(archivo)[0]
                conocidos.append({"no_cuenta": alumno_id, "encoding": encs[0]})
    return conocidos

@app.post("/comparar")
async def comparar(foto: UploadFile = File(...)):
    if not os.path.exists("/app/temp_captures"):
        os.makedirs("/app/temp_captures")
        
    ruta_temp = f"/app/temp_captures/{foto.filename}"
    with open(ruta_temp, "wb") as f:
        shutil.copyfileobj(foto.file, f)
    
    img = face_recognition.load_image_file(ruta_temp)
    encodings_nueva = face_recognition.face_encodings(img)
    if os.path.exists(ruta_temp):
        os.remove(ruta_temp)

    if not encodings_nueva:
        return JSONResponse({"status": "error", "message": "No se detecto rostro"})

    conocidos = cargar_encodings()
    if not conocidos:
        return JSONResponse({"status": "error", "message": "No hay alumnos registrados en la carpeta"})

    enc_nueva = encodings_nueva[0]
    for alumno in conocidos:
        # Compara con un umbral de 0.5 (menor es más estricto)
        match = face_recognition.compare_faces([alumno["encoding"]], enc_nueva, tolerance=0.5)
        if match[0]:
            return {
                "status": "success",
                "no_cuenta": alumno["no_cuenta"]
            }

    return JSONResponse({"status": "unknown", "message": "Alumno no reconocido"})