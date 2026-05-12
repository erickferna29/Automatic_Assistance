#include "esp_camera.h"
#include <WiFi.h>
#include "esp_vfs_fat.h"
#include "sdmmc_cmd.h"
#include "driver/sdmmc_host.h"

#define BUTTON_PIN 2

// ===========================
// Select camera model in board_config.h
// ===========================
#include "board_config.h"

// ===========================
// Enter your WiFi credentials
// ===========================
// ── Red de Chamba ──────────────────────
const char *ssid     = "INFINITUM5DE6_2.4";
const char *password = "Mp7FhGKrRs";

// ── Red de casa ──────────────────────
//const char *ssid     = "LL2004_2.4";
//const char *password = "Ab982076522";

// ── Hotspot del celular ───────────────
//const char *ssid     = "Erickferna29";
//const char *password = "Er12121212";

//Cambia a la ip asignada d ela pc actual
const char *ipActual = "172.27.208.1";


void startCameraServer();
void setupLedFlash();

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();

  // ── Iniciar SD ──────────────────────────────────────────
  Serial.println("Iniciando SD...");

  sdmmc_host_t host = SDMMC_HOST_DEFAULT();
  host.max_freq_khz = 400;

  sdmmc_slot_config_t slot = SDMMC_SLOT_CONFIG_DEFAULT();
  slot.width = 1;
  slot.clk   = GPIO_NUM_39;
  slot.cmd   = GPIO_NUM_38;
  slot.d0    = GPIO_NUM_40;
  slot.flags |= SDMMC_SLOT_FLAG_INTERNAL_PULLUP;

  esp_vfs_fat_mount_config_t mount = {
    .format_if_mount_failed = false,
    .max_files = 5,
    .allocation_unit_size = 4096
  };

  sdmmc_card_t *card;
  esp_err_t ret = esp_vfs_fat_sdmmc_mount("/sdcard", &host, &slot, &mount, &card);
  if (ret == ESP_OK) {
    Serial.println("SD lista!");
    Serial.printf("Tamanio: %lluMB\n",
      (uint64_t)card->csd.capacity * card->csd.sector_size / (1024 * 1024));
  } else {
    Serial.printf("Error SD: 0x%x\n", ret);
  }
  // ────────────────────────────────────────────────────────

  // ── Iniciar camara ───────────────────────────────────────
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
  config.frame_size   = FRAMESIZE_UXGA;
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode    = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location  = CAMERA_FB_IN_PSRAM;
  config.jpeg_quality = 12;
  config.fb_count     = 1;

  if (config.pixel_format == PIXFORMAT_JPEG) {
    if (psramFound()) {
      config.jpeg_quality = 10;
      config.fb_count     = 2;
      config.grab_mode    = CAMERA_GRAB_LATEST;
    } else {
      config.frame_size  = FRAMESIZE_SVGA;
      config.fb_location = CAMERA_FB_IN_DRAM;
    }
  } else {
    config.frame_size = FRAMESIZE_240X240;
#if CONFIG_IDF_TARGET_ESP32S3
    config.fb_count = 2;
#endif
  }

#if defined(CAMERA_MODEL_ESP_EYE)
  pinMode(13, INPUT_PULLUP);
  pinMode(14, INPUT_PULLUP);
#endif

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x\n", err);
    return;
  }

  sensor_t *s = esp_camera_sensor_get();
  if (s->id.PID == OV3660_PID) {
    s->set_vflip(s, 1);
    s->set_brightness(s, 1);
    s->set_saturation(s, -2);
  }
  if (config.pixel_format == PIXFORMAT_JPEG) {
    s->set_framesize(s, FRAMESIZE_QVGA);
  }

#if defined(CAMERA_MODEL_M5STACK_WIDE) || defined(CAMERA_MODEL_M5STACK_ESP32CAM)
  s->set_vflip(s, 1);
  s->set_hmirror(s, 1);
#endif

#if defined(CAMERA_MODEL_ESP32S3_EYE)
  s->set_vflip(s, 1);
#endif

#if defined(LED_GPIO_NUM)
  setupLedFlash();
#endif
  // ────────────────────────────────────────────────────────

  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // ── WiFi ─────────────────────────────────────────────────
  // Sin IP estatica - DHCP funciona en cualquier red/hotspot
  WiFi.begin(ssid, password);
  WiFi.setTxPower(WIFI_POWER_8_5dBm);
  WiFi.setSleep(false);

  Serial.print("WiFi connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  // ────────────────────────────────────────────────────────

  startCameraServer();
  Serial.print("Camera Ready! Use 'http://");
  Serial.print(WiFi.localIP());
  Serial.println("' to connect");
}

// ── Captura y guarda foto en SD ──────────────────────────────────
void do_capture() {
  // Descartar frames viejos del buffer
  camera_fb_t *fb = esp_camera_fb_get();
  esp_camera_fb_return(fb);
  delay(100);
  // Tomar el frame fresco
  fb = esp_camera_fb_get();
  
  if (!fb || fb->len == 0) {
    Serial.println("ERROR: Frame vacio.");
    if (fb) esp_camera_fb_return(fb);
    return;
  }

  char path[64];
  snprintf(path, sizeof(path), "/sdcard/foto_%lu.jpg", millis());
  Serial.printf("Guardando: %s (%zu bytes)\n", path, fb->len);

  FILE *f = fopen(path, "wb");
  if (!f) {
    Serial.println("ERROR: No se pudo abrir archivo.");
  } else {
    fwrite(fb->buf, 1, fb->len, f);
    fclose(f);
    Serial.println("OK!");
  }
WiFiClient client;
const char* server_ip = ipctual;
int server_port = 8085; // Puerto de tu contenedor Apache/PHP

if (client.connect(server_ip, server_port)) {
    Serial.println("Enviando al servidor...");
    
    client.println("POST /comparar_rostro.php HTTP/1.1");
    client.println("Host: " + String(server_ip));
    client.println("Content-Type: image/jpeg");
    client.print("Content-Length: ");
    client.println(fb->len);
    client.println("Connection: close");
    client.println();
    
    // Enviar los bytes de la imagen directamente
    client.write(fb->buf, fb->len);
    
    while (client.connected()) {
        String line = client.readStringUntil('\n');
        if (line == "\r") break;
    }
    String response = client.readString();
    Serial.println("Respuesta: " + response);
    client.stop();
} else {
    Serial.println("Fallo conexion al servidor");
}

esp_camera_fb_return(fb);
}
// ────────────────────────────────────────────────────────────────

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(50);
    if (digitalRead(BUTTON_PIN) == LOW) {
      Serial.println("Boton activado! Capturando...");
      do_capture();
      while (digitalRead(BUTTON_PIN) == LOW) {
        delay(10);
      }
      Serial.println("Boton liberado. Listo.");
    }
  }
  delay(10);
}

