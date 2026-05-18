# Automatic Assistence — Guía Completa de Instalación y Configuración

## 📁 Estructura del Proyecto

```
AutomaticAssistence/
├── App.js                          ← Punto de entrada
├── package.json                    ← Dependencias
├── babel.config.js
├── metro.config.js
├── android/
│   └── AndroidManifest.xml         ← Permisos Android
└── src/
    ├── navigation/
    │   └── AppNavigator.js         ← Rutas/pantallas
    ├── services/
    │   └── api.js                  ← 🔌 Conexión al backend/BD
    └── screens/
        ├── LoginScreen.js          ← Pantalla 1: Login
        ├── PermissionsScreen.js    ← Pantalla 2: Bluetooth + Cámara
        ├── PermissionsDeniedScreen.js ← Pantalla 3: Permisos denegados
        ├── PhotoCaptureScreen.js   ← Pantalla 4: Tomar foto
        └── WelcomeScreen.js        ← Pantalla 5: Bienvenida + señal
```

---

## ⚙️ Prerequisitos (instálalos en este orden)

### 1. Node.js 18 o superior
Descarga desde: https://nodejs.org/en/download
Verifica: `node --version` → debe mostrar v18.x.x o superior

### 2. Java Development Kit (JDK) 17
Descarga desde: https://www.oracle.com/java/technologies/downloads/#java17
O con Winget: `winget install EclipseAdoptium.Temurin.17.JDK`
Verifica: `java --version`

### 3. Android Studio
Descarga desde: https://developer.android.com/studio
Durante la instalación, selecciona:
- Android SDK
- Android SDK Platform
- Android Virtual Device (AVD)

### 4. Configurar variables de entorno (Windows)
Agrega estas variables en Panel de Control → Sistema → Variables de entorno:

```
ANDROID_HOME = C:\Users\TU_USUARIO\AppData\Local\Android\Sdk
JAVA_HOME    = C:\Program Files\Eclipse Adoptium\jdk-17.x.x (ruta de tu JDK)
```

Y agrega a la variable PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

### 5. React Native CLI (global)
```bash
npm install -g react-native-cli
```

---

## 🛠️ Crear el Proyecto Base en VS Code

> IMPORTANTE: La carpeta que te entrego contiene solo el código fuente.
> Debes crear el proyecto base de React Native primero y luego copiar estos archivos.

### Paso 1: Crear proyecto nuevo
Abre la terminal en VS Code (Ctrl + `) y ejecuta:
```bash
npx react-native@0.73.6 init AutomaticAssistence --version 0.73.6
cd AutomaticAssistence
```

### Paso 2: Copiar los archivos de este proyecto
Copia y reemplaza los siguientes archivos en la carpeta del proyecto:
- `App.js`
- `babel.config.js`
- `metro.config.js`
- Toda la carpeta `src/`
- El contenido de `android/AndroidManifest.xml` → cópialo a `android/app/src/main/AndroidManifest.xml`

---

## 📦 Instalar Dependencias

Ejecuta estos comandos en la terminal, dentro de la carpeta del proyecto:

### Dependencias principales
```bash
npm install @react-navigation/native@^6.1.17
npm install @react-navigation/stack@^6.3.29
npm install react-native-screens@^3.31.1
npm install react-native-safe-area-context@^4.10.1
npm install react-native-gesture-handler@^2.16.2
npm install react-native-reanimated@^3.11.0
npm install axios@^1.7.2
```

### Cámara
```bash
npm install react-native-camera@^4.2.1
```

### Permisos
```bash
npm install react-native-permissions@^4.1.5
```

### Íconos (opcional, para futuros íconos vectoriales)
```bash
npm install react-native-vector-icons@^10.1.0
```

---

## 🔧 Configuración Post-Instalación

### 1. react-native-reanimated (babel.config.js)
Ya está configurado en el `babel.config.js` incluido. Verifica que contenga:
```js
plugins: ['react-native-reanimated/plugin'],
```

### 2. react-native-camera — Configurar Android
Abre `android/app/build.gradle` y agrega dentro de `android { ... }`:
```gradle
android {
    ...
    defaultConfig {
        ...
        missingDimensionStrategy 'react-native-camera', 'general'
    }
}
```

### 3. react-native-permissions — Configurar Android
Abre `android/app/build.gradle` y en la sección `dependencies` agrega:
```gradle
implementation "com.google.android.gms:play-services-vision:20.1.3"
```

### 4. Copiar el AndroidManifest.xml
El archivo `android/AndroidManifest.xml` de este proyecto contiene todos los
permisos necesarios. Copia su contenido y reemplaza el archivo en:
`android/app/src/main/AndroidManifest.xml`

---

## 🗄️ Configurar la Conexión a tu Backend/MariaDB

### Arquitectura de conexión
```
[App React Native] → HTTP → [Tu Backend (Node.js/Express/Laravel)] → SQL → [MariaDB]
```

### Paso 1: Edita src/services/api.js
Busca la sección `API_CONFIG` al inicio del archivo:
```js
const API_CONFIG = {
  BASE_URL: 'http://10.0.2.2:3000',  // ← Cambia esto
  ...
};
```

**Para Android Emulator:** usa `http://10.0.2.2:PUERTO`
**Para dispositivo físico en la misma red:** usa `http://192.168.X.X:PUERTO`
**Para producción:** usa `https://api.tudominio.com`

### Paso 2: Adapta los campos de tu BD
En el archivo `api.js` cada función tiene comentarios detallados con:
- Los campos que debe tener tu tabla en MariaDB
- La consulta SQL que debe ejecutar el backend
- El formato de respuesta esperado

### Campos requeridos en tu tabla de usuarios:
| Campo      | Tipo          | Descripción                        |
|------------|---------------|------------------------------------|
| id         | INT (PK)      | ID único del usuario               |
| no_cuenta  | VARCHAR       | Número de cuenta (login)           |
| nip        | VARCHAR       | NIP de acceso (usar bcrypt)        |
| nombre     | VARCHAR       | Nombre completo del usuario        |
| foto_url   | VARCHAR/NULL  | Ruta de la foto (NULL = sin foto)  |

---

## 📱 Crear y Correr el Emulador en Android Studio

### Crear AVD (Dispositivo Virtual)
1. Abre Android Studio
2. Ve a: Tools → Device Manager
3. Clic en "Create Device"
4. Selecciona un dispositivo: **Pixel 6** (recomendado)
5. Selecciona imagen del sistema: **API 33** (Android 13) — descárgala si no está
6. Clic en "Finish"

### Iniciar el emulador
En Device Manager, presiona el botón ▶ junto al dispositivo creado.
Espera a que cargue completamente el sistema Android.

---

## ▶️ Correr la Aplicación

### Terminal 1 — Metro Bundler (deja esta abierta)
```bash
cd AutomaticAssistence
npx react-native start
```
Presiona `a` para abrir en Android automáticamente, o ejecuta:

### Terminal 2 — Build e instalar en emulador
```bash
cd AutomaticAssistence
npx react-native run-android
```

El primer build toma 5-10 minutos. Los siguientes son más rápidos.

---

## 🐛 Solución de Problemas Comunes

### Error: "SDK location not found"
→ Asegúrate de que `ANDROID_HOME` esté configurado correctamente.
→ Crea el archivo `android/local.properties` con:
```
sdk.dir=C:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk
```
(usa \\ doble en Windows)

### Error: "JAVA_HOME is not set"
→ Configura la variable de entorno JAVA_HOME apuntando a tu JDK.

### Error: "Unable to connect to Metro"
→ Asegúrate de que Metro Bundler esté corriendo (Terminal 1).
→ Agita el emulador o presiona `R` dos veces en Metro.

### Error: "react-native-camera no funciona"
→ Verifica que `missingDimensionStrategy` esté en build.gradle.
→ Haz un clean build:
```bash
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

### La app no conecta al backend
→ Verifica que estés usando `10.0.2.2` y no `localhost` para el emulador.
→ Verifica que `android:usesCleartextTraffic="true"` esté en el Manifest (HTTP sin SSL).

---

## 🔒 Consideraciones de Seguridad para Producción

1. **NIP:** Nunca guardes el NIP en texto plano. Usa bcrypt en el backend.
2. **HTTPS:** Cambia `usesCleartextTraffic` a `false` y usa SSL en producción.
3. **Tokens:** Implementa JWT para autenticación después del login.
4. **Foto:** Valida el tipo y tamaño del archivo en el backend antes de guardar.
