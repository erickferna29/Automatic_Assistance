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

// ¡NUEVOS PINES 100% LIBRES! (Aislados de la cámara y la memoria)
#define I2C_SDA 4
#define I2C_SCL 5

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ===========================
// CONFIGURACIÓN DE RED Y SERVIDOR
// ===========================
const char* ssid     = "laptop";       // Asegúrate que esté en 2.4GHz
const char* password = "12345678";  
const char *ipActual = "TU_IP";
int server_port      = 8050; 

// ===========================
// CONFIGURACIÓN BLUETOOTH
// ===========================
int scanTime = 2; 
BLEScan* pBLEScan = nullptr; 
String uuid_secreto = "0000abcd-0000-1000-8000-00805f9b34fb";
String url_asistencia = "http://" + String(ipActual) + ":" + String(server_port) + "/asistencia";
String url_estado = "http://" + String(ipActual) + ":" + String(server_port) + "/estado_clase";

class MyAdvertiseDeviceCallBacks: public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice advertisedDevice) { } 
};

void actualizarPantalla(String materia, int total, String mensajeInfo) {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.println("--- ASISTENCIA UAS ---");
  
  display.setCursor(0, 14);
  display.setTextSize(2);
  display.println(materia);
  
  display.setCursor(0, 34);
  display.setTextSize(1);
  display.print("Total Presentes: ");
  display.setTextSize(2);
  display.println(total);
  
  display.setCursor(0, 54);
  display.setTextSize(1);
  display.println(mensajeInfo);
  display.display();
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n--- INICIANDO SISTEMA BLINDADO ---");

  // 1. INICIAR PANTALLA EN SU PROPIO BUS (14 Y 21)
  Wire.begin(I2C_SDA, I2C_SCL);
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("Fallo OLED en 0x3C, probando 0x3D..."));
    display.begin(SSD1306_SWITCHCAPVCC, 0x3D);
  }
  display.setRotation(0);
  actualizarPantalla("Iniciando", 0, "Hardware OK");

  // 2. INICIAR CÁMARA (Ahora está sola y feliz en los pines 4 y 5)
  Serial.println("Iniciando Camara...");
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = Y2_GPIO_NUM;
  config.pin_d1       = Y3_GPIO_NUM;
  config.pin_d2       = Y4_GPIO_NUM;
  config.pin_d3       = Y5_GPIO_NUM;
  config.pin_d4       = Y6_GPIO_NUM;
  config.pin_d5       = Y7_GPIO_NUM;
  config.pin_d6       = Y8_GPIO_NUM;
  config.pin_d7       = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM; // Pin 4 original
  config.pin_sccb_scl = SIOC_GPIO_NUM; // Pin 5 original
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.frame_size   = FRAMESIZE_QVGA; 
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode    = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location  = CAMERA_FB_IN_PSRAM;
  config.jpeg_quality = 12;
  config.fb_count     = 1;

  if (psramFound()) {
    config.jpeg_quality = 10;
    config.fb_count     = 2;
    config.grab_mode    = CAMERA_GRAB_LATEST;
  }
  
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Error de camara (0x%x)\n", err);
    actualizarPantalla("ERROR", 0, "Camara falló");
  } else {
    Serial.println("Camara lista.");
  }

  // 3. LIMPIEZA Y CONEXIÓN WIFI
  Serial.print("Limpiando memoria de la antena Wi-Fi...");
  WiFi.disconnect(true, true); 
  delay(1000);
  
  Serial.print("\nConectando a la red: ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA); 
  WiFi.begin(ssid, password);
  
  int intentosWiFi = 0;
  while (WiFi.status() != WL_CONNECTED && intentosWiFi < 30) { 
    delay(500); 
    Serial.print("."); 
    actualizarPantalla("Iniciando", 0, "WiFi... " + String(intentosWiFi));
    intentosWiFi++;
  }

  if(WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Conectado!");
    actualizarPantalla("Iniciando", 0, "WiFi OK");
  } else {
    Serial.println("\nERROR CRÍTICO: No se pudo conectar al WiFi.");
    actualizarPantalla("Error Red", 0, "Revisa Hotspot");
  }

  // 4. INICIAR BLUETOOTH
  Serial.println("Iniciando Bluetooth...");
  BLEDevice::init("ESP32_Asistencia"); 
  pBLEScan = BLEDevice::getScan();
  if (pBLEScan != nullptr) {
    pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertiseDeviceCallBacks()); 
    pBLEScan->setActiveScan(true); 
    pBLEScan->setInterval(100);
    pBLEScan->setWindow(99);
  }

  // 5. CONSULTAR ESTADO DE LA CLASE A FASTAPI
  if(WiFi.status() == WL_CONNECTED) {
    Serial.println("Consultando clase activa a FastAPI...");
    HTTPClient http;
    http.begin(url_estado);
    int httpCode = http.GET();
    if(httpCode == 200) {
      String payload = http.getString();
      StaticJsonDocument<256> doc;
      deserializeJson(doc, payload);
      String materia = doc["materia"].as<String>();
      int total = doc["total"].as<int>();
      actualizarPantalla(materia, total, "Radar activo");
    } else {
      actualizarPantalla("Error Serv", 0, "Revisa FastAPI");
    }
    http.end();
  }
}

void loop() {
  if (pBLEScan != nullptr && WiFi.status() == WL_CONNECTED) {
    BLEScanResults* foundDevices = pBLEScan->start(scanTime, false);
    int totalDispositivos = foundDevices->getCount();

    for(int i = 0; i < totalDispositivos; i++){
      BLEAdvertisedDevice dispositivo = foundDevices->getDevice(i);
      
      if (dispositivo.haveServiceUUID() && dispositivo.getServiceUUID().toString() == uuid_secreto){
        if(dispositivo.haveName()){
          String no_cuenta = dispositivo.getName().c_str();
          
          HTTPClient http;
          http.begin(url_asistencia);
          http.addHeader("Content-Type", "application/json");
          
          String datosJson = "{\"id_alumno\":\"" + no_cuenta + "\"}";
          int codigoRespuesta = http.POST(datosJson);
          
          if(codigoRespuesta == 200) {
            String payload = http.getString();
            StaticJsonDocument<256> doc;
            DeserializationError error = deserializeJson(doc, payload);
            
            if (!error) {
              String status = doc["status"].as<String>();
              if (status == "success") {
                String materia = doc["materia"].as<String>();
                int total = doc["total"].as<int>();
                actualizarPantalla(materia, total, "+ " + no_cuenta + " OK");
              } else {
                String mensaje = doc["mensaje"].as<String>();
                actualizarPantalla("BLOQUEADO", 0, "Desc: " + mensaje);
              }
            }
          }
          http.end(); 
        }
      }
    }
    pBLEScan->clearResults(); 
  }
  delay(50); 
}