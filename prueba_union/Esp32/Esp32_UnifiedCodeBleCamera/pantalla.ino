#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1

// Pines I2C más seguros para el modelo S3 N16R8
#define I2C_SDA 4
#define I2C_SCL 5

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

void setup() {
  Serial.begin(115200);
  
  // Damos tiempo para que Linux monte el puerto USB
  delay(3000); 
  
  Serial.println(F("\n--- Iniciando prueba de pantalla ---"));

  // Inicializar bus I2C en los pines 4 y 5
  Wire.begin(I2C_SDA, I2C_SCL);

  // Intentar 0x3C primero, si falla intentar 0x3D
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("Fallo 0x3C, probando 0x3D..."));
    if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3D)) {
      Serial.println(F("Fallo critico. La pantalla no responde. Revisa los cables 4 y 5."));
      for(;;); // Bucle infinito si falla
    }
  }

  Serial.println(F("¡Pantalla detectada con exito!"));

  // Limpiar e iniciar sin rotación para respetar el orden Amarillo/Azul
  display.setRotation(0); 
  display.clearDisplay();
  display.setTextSize(1);             
  display.setTextColor(SSD1306_WHITE); 

  // --- ZONA AMARILLA (Pixeles 0 al 15) ---
  display.setCursor(0, 0);           
  display.println(F("¡ZONA AMARILLA!"));

  // --- ZONA AZUL (Pixeles 16 al 63) ---
  display.setCursor(0, 20);           
  display.println(F("Zona azul..."));
  display.setCursor(0, 35);
  display.println(F("Ya jalo el ESP32-S3"));
  
  // Enviar a la pantalla
  display.display();
}

void loop() {
  // Animación de parpadeo para confirmar que el procesador no se ha congelado
  display.invertDisplay(true);
  delay(1000);
  display.invertDisplay(false);
  delay(1000);
}