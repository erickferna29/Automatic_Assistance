#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include "esp_vfs_fat.h"
#include "sdmmc_cmd.h"
#include "driver/sdmmc_host.h"
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>

#define BUTTON_PIN 2
#include "board_config.h"

// ===========================
// CONFIGURACIÓN DE RED Y SERVIDOR
// ===========================
const char* ssid     = "INFINITUM29DF";       
const char* password = "PF3hx2bADE";  
const char *ipActual = "192.168.1.110";
int server_port      = 8050; 

// ===========================
// CONFIGURACIÓN BLUETOOTH
// ===========================
int scanTime = 2; 
BLEScan* pBLEScan = nullptr; 
String uuid_secreto = "0000abcd-0000-1000-8000-00805f9b34fb";
String url_asistencia = "http://" + String(ipActual) + ":" + String(server_port) + "/asistencia";

class MyAdvertiseDeviceCallBacks: public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice advertisedDevice) { } 
};

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println("\n--- INICIANDO SISTEMA HÍBRIDO ---");

  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // ── 1. INICIAR BLUETOOTH PRIMERO ──
  Serial.println("Iniciando Radar BLE...");
  BLEDevice::init("ESP32_Asistencia"); 
  pBLEScan = BLEDevice::getScan();
  
  if (pBLEScan != nullptr) {
    pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertiseDeviceCallBacks()); 
    pBLEScan->setActiveScan(true); 
    pBLEScan->setInterval(100);
    pBLEScan->setWindow(99);
    Serial.println("Radar BLE Listo.");
  } else {
    Serial.println(">>> ADVERTENCIA: Falló el inicio de BLE.");
  }

  // ── 2. INICIAR WIFI ──
  Serial.print("Conectando a WiFi...");
  WiFi.begin(ssid, password);
  WiFi.setTxPower(WIFI_POWER_8_5dBm);
  WiFi.setSleep(false);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi conectado.");

  // ── 3. INICIAR TARJETA SD ──
  sdmmc_host_t host = SDMMC_HOST_DEFAULT();
  host.max_freq_khz = 400;
  sdmmc_slot_config_t slot = SDMMC_SLOT_CONFIG_DEFAULT();
  slot.width = 1;
  slot.clk   = GPIO_NUM_39;
  slot.cmd   = GPIO_NUM_38;
  slot.d0    = GPIO_NUM_40;
  slot.flags |= SDMMC_SLOT_FLAG_INTERNAL_PULLUP;
  esp_vfs_fat_mount_config_t mount = { .format_if_mount_failed = false, .max_files = 5, .allocation_unit_size = 4096 };
  sdmmc_card_t *card;
  if (esp_vfs_fat_sdmmc_mount("/sdcard", &host, &slot, &mount, &card) == ESP_OK) {
    Serial.println("SD lista.");
  } else {
    Serial.println("Aviso: SD no detectada. Ignorando guardado local...");
  }

  // ── 4. INICIAR CÁMARA (Blindada contra errores de memoria) ──
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
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  
  // INICIAR EN RESOLUCIÓN BAJA (QVGA) PARA EVITAR CRASHEO DE MALLOC
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
  } else {
    config.fb_location = CAMERA_FB_IN_DRAM;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf(">>> ERROR: Falló inicio de cámara (0x%x).\n", err);
  } else {
    sensor_t *s = esp_camera_sensor_get();
    if (s != nullptr) {
      if (s->id.PID == OV3660_PID) {
        s->set_vflip(s, 1); 
        s->set_brightness(s, 1); 
        s->set_saturation(s, -2);
      }
      Serial.println("Cámara Lista.");
    }
  }

  Serial.println("\n--- SISTEMA LISTO Y ESPERANDO ---");
}

void do_capture() {
  camera_fb_t *fb = esp_camera_fb_get();
  esp_camera_fb_return(fb);
  delay(100);
  fb = esp_camera_fb_get();
  
  if (!fb || fb->len == 0) {
    Serial.println("ERROR: Frame vacio.");
    if (fb) esp_camera_fb_return(fb);
    return;
  }

  // Guardar en SD si está disponible
  FILE *f = fopen("/sdcard/ultima_foto.jpg", "wb");
  if (f) {
    fwrite(fb->buf, 1, fb->len, f);
    fclose(f);
  }

  WiFiClient client;
  if (client.connect(ipActual, server_port)) {
    Serial.println("Conectado a FastAPI! Enviando foto...");

    String boundary = "--------------------------1234567890";
    String head = "--" + boundary + "\r\n";
    head += "Content-Disposition: form-data; name=\"foto\"; filename=\"foto.jpg\"\r\n";
    head += "Content-Type: image/jpeg\r\n\r\n";
    String tail = "\r\n--" + boundary + "--\r\n";

    uint32_t totalLen = head.length() + fb->len + tail.length();

    client.println("POST /asistencia_visual HTTP/1.1"); 
    client.println("Host: " + String(ipActual));
    client.println("Content-Type: multipart/form-data; boundary=" + boundary);
    client.print("Content-Length: ");
    client.println(totalLen);
    client.println("Connection: close");
    client.println(); 

    client.print(head);             
    client.write(fb->buf, fb->len);  
    client.print(tail);             

    unsigned long timeout = millis();
    while (client.available() == 0) {
      if (millis() - timeout > 15000) { 
        Serial.println(">>> Timeout Servidor");
        client.stop();
        esp_camera_fb_return(fb);
        return;
      }
    }

    String response = client.readString();
    Serial.println(response);
    client.stop();
  } else {
    Serial.println("Fallo conexion a FastAPI");
  }

  esp_camera_fb_return(fb);
}

void loop() {
  // 1. REVISAR BOTÓN FÍSICO
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(50);
    if (digitalRead(BUTTON_PIN) == LOW) {
      Serial.println("Boton activado! Capturando foto...");
      do_capture();
      while (digitalRead(BUTTON_PIN) == LOW) delay(10);
    }
  }

  // 2. MODO RADAR BLUETOOTH
  if (pBLEScan != nullptr) {
    BLEScanResults* foundDevices = pBLEScan->start(scanTime, false);
    int totalDispositivos = foundDevices->getCount();

    if(WiFi.status() == WL_CONNECTED && totalDispositivos > 0){
      HTTPClient http; 

      for(int i = 0; i < totalDispositivos; i++){
        BLEAdvertisedDevice dispositivo = foundDevices->getDevice(i);
        
        if (dispositivo.haveServiceUUID() && dispositivo.getServiceUUID().toString() == uuid_secreto){
          if(dispositivo.haveName()){
            String no_cuenta = dispositivo.getName().c_str();
            Serial.print("Alumno BLE detectado: ");
            Serial.println(no_cuenta);

            http.begin(url_asistencia);
            http.addHeader("Content-Type", "application/json");
            String datosJson = "{\"id_alumno\":" + no_cuenta + "}";
            int codigoRespuesta = http.POST(datosJson);
            
            if(codigoRespuesta > 0) {
              Serial.printf(" -> Log guardado (HTTP %d)\n", codigoRespuesta);
            } else {
              Serial.printf(" -> Servidor apagado o inalcanzable (Error %d)\n", codigoRespuesta);
            }
            http.end(); 
          }
        }
      }
    }
    
    pBLEScan->clearResults(); 
  }
  
  delay(100); 
}