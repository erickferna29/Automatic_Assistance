#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>

#include "board_config.h"

// ===========================
// CONFIGURACIÓN PANTALLA OLED
// ===========================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

#define I2C_SDA 3
#define I2C_SCL 46

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ===========================
// CONFIGURACIÓN DE RED Y SERVIDOR
// ===========================
const char* ssid     = "INFINITUM29DF";
const char* password = "PF3hx2bADE";
const char *ipActual = "192.168.1.90";
int server_port = 8050;

// ===========================
// CONFIGURACIÓN BLUETOOTH
// ===========================
int scanTime = 2;
BLEScan* pBLEScan = nullptr;

String uuid_secreto = "0000abcd-0000-1000-8000-00805f9b34fb";
String url_asistencia = "http://" + String(ipActual) + ":" + String(server_port) + "/asistencia";
String url_estado = "http://" + String(ipActual) + ":" + String(server_port) + "/estado_clase";

// ===========================
// VARIABLES GLOBALES
// ===========================
bool claseActiva = false;
String materiaActual = "";
int alumnosPresentes = -1;

unsigned long ultimoChequeoEstado = 0;
unsigned long intervaloChequeo = 0;

// ===========================
// CALLBACK BLE
// ===========================
class MyAdvertiseDeviceCallBacks: public BLEAdvertisedDeviceCallbacks {
void onResult(BLEAdvertisedDevice advertisedDevice) { }
};

// ===========================
// FUNCIÓN PANTALLA OLED
// ===========================
void actualizarPantalla(String materia, int total, String mensajeInfo) {
display.clearDisplay();

String horaActual = "10:45";

Serial.println("\n[--- PANTALLA OLED ---]");
Serial.println("Hora       : " + horaActual);
Serial.println("Materia    : " + materia);
Serial.println("Asistencia : " + String(total));
Serial.println("Estado     : " + mensajeInfo);
Serial.println("-----------------------\n");

display.setTextSize(1);
display.setTextColor(SSD1306_WHITE);

display.setCursor(0, 0);
display.println("Hora: " + horaActual);

display.setCursor(0, 15);
display.println("Materia:");
display.println(materia);

display.setCursor(0, 40);
display.println("Asistencia: " + String(total));

display.setCursor(0, 55);
display.println(mensajeInfo);

display.display();
}

// ===========================
// FUNCIÓN WIFI
// ===========================
void conectarWiFi() {
WiFi.begin(ssid, password);

Serial.print("Conectando a WiFi");

while (WiFi.status() != WL_CONNECTED) {
delay(500);
Serial.print(".");
}

Serial.println("\nWiFi conectado");
Serial.println(WiFi.localIP());
}

// ===========================
// VERIFICAR ESTADO DE CLASE
// ===========================
void verificarEstadoClase() {
if (WiFi.status() != WL_CONNECTED) return;

HTTPClient http;
http.begin(url_estado);

// ===========================
// CAMBIO REALIZADO:
// SE AGREGA TIMEOUT PARA EVITAR
// QUE WIFI CONGELE EL BLE
// ===========================
http.setTimeout(2000);

int httpResponseCode = http.GET();

if (httpResponseCode > 0) {
String payload = http.getString();

Serial.println("Estado clase:");
Serial.println(payload);

DynamicJsonDocument doc(512);
deserializeJson(doc, payload);

String statusClase = doc["status"];

bool nuevaClaseActiva = (statusClase == "active");

String nuevaMateria = doc["nombre_materia"];

int nuevosPresentes = doc["total"];

claseActiva = nuevaClaseActiva;
materiaActual = nuevaMateria;
alumnosPresentes = nuevosPresentes;

if (claseActiva) {
  intervaloChequeo = 15000;
  actualizarPantalla(materiaActual, alumnosPresentes, "Clase activa");
} else {
  intervaloChequeo = 5000;
  actualizarPantalla("Sin clase", 0, "Esperando clase");
}


}
else {
Serial.print("Error GET estado: ");
Serial.println(httpResponseCode);
}

http.end();
}

// ===========================
// ENVIAR ASISTENCIA
// ===========================
void enviarAsistencia(String idAlumno) {
if (WiFi.status() != WL_CONNECTED) return;

HTTPClient http;
http.begin(url_asistencia);

// ===========================
// CAMBIO REALIZADO:
// SE AGREGA TIMEOUT PARA EVITAR
// BLOQUEOS ENTRE WIFI Y BLE
// ===========================
http.setTimeout(2000);

http.addHeader("Content-Type", "application/json");

DynamicJsonDocument doc(256);
doc["id_alumno"] = idAlumno;

String datosJson;
serializeJson(doc, datosJson);

int httpResponseCode = http.POST(datosJson);

Serial.print("POST asistencia: ");
Serial.println(httpResponseCode);

if (httpResponseCode > 0) {
String response = http.getString();
Serial.println(response);
}

http.end();
}

// ===========================
// SETUP
// ===========================
void setup() {
Serial.begin(115200);

// OLED
Wire.begin(I2C_SDA, I2C_SCL);

if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
Serial.println("No se encontro pantalla OLED");
while (true);
}

display.clearDisplay();
display.display();

actualizarPantalla("Iniciando", 0, "Conectando...");

// WiFi
conectarWiFi();

// BLE
BLEDevice::init("");

pBLEScan = BLEDevice::getScan();
pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertiseDeviceCallBacks());
pBLEScan->setActiveScan(true);

verificarEstadoClase();
}

// ===========================
// LOOP PRINCIPAL
// ===========================
void loop() {

// ===========================
// VERIFICAR ESTADO CLASE
// ===========================
if (millis() - ultimoChequeoEstado >= intervaloChequeo) {
ultimoChequeoEstado = millis();
verificarEstadoClase();
}

// ===========================
// SI NO HAY CLASE ACTIVA
// ===========================
if (!claseActiva) {
delay(1000);
return;
}

Serial.println("Radar activo...");

// ===========================
// CAMBIO REALIZADO:
// EL TRUE EVITA BLOQUEOS
// ENTRE BLE Y WIFI
// ===========================
BLEScanResults* foundDevices = pBLEScan->start(scanTime, true);

int count = foundDevices->getCount();

Serial.print("Dispositivos encontrados: ");
Serial.println(count);

for (int i = 0; i < count; i++) {
BLEAdvertisedDevice dispositivo = foundDevices->getDevice(i);


// ===========================
// CAMBIO REALIZADO:
// DEBUG PARA VER SI BLE
// DETECTA DISPOSITIVOS
// ===========================
Serial.println(dispositivo.toString().c_str());

if (
    dispositivo.haveServiceUUID() &&
    dispositivo.getServiceUUID().toString() == uuid_secreto &&
    dispositivo.haveName()
) {

    String idAlumno = dispositivo.getName().c_str();

    // Evitar nombres vacíos
    if (idAlumno.length() == 0) {
        return;
    }

    Serial.println("Dispositivo autorizado detectado");

    Serial.print("Alumno detectado: ");
    Serial.println(idAlumno);

    enviarAsistencia(idAlumno);

    actualizarPantalla(materiaActual, alumnosPresentes, "Alumno detectado");

    delay(3000);
}


}

// ===========================
// CAMBIO REALIZADO:
// YA NO SE USA stop()
// PORQUE ROMPIA EL BLE
// ===========================

pBLEScan->clearResults();

delay(1000);
}
