#include <WiFi.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>

const char* ssid= "POCO F5";
const char* password= "marco903";

//bluethoot class for scanning MACs
int scanTime = 5;
BLEScan* pBLEScan;

class MyAdvertiseDeviceCallBacks: public BLEAdvertisedDeviceCallbacks {
 
  void onResult(BLEAdvertisedDevice advertisedDevice) { 
    Serial.print("Dispositivo detectado -> MAC: ");

    // se saca la direccion MAC del dispositivo y lo imprimimos
    Serial.println(advertisedDevice.getAddress().toString().c_str());
  }
};

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("intentando conectar a la red: ");
  Serial.println(ssid);

  WiFi.begin(ssid,password);

  while(WiFi.status() != WL_CONNECTED){
    delay(500);
    Serial.print(".");
  };

  Serial.println();
  Serial.println("==================");

  Serial.println("Tu direccion ip local es: ");
  Serial.println(WiFi.localIP());

  Serial.println("==================");

  delay(1000);
  Serial.println("Iniciando radar BLE...");

  BLEDevice::init("ESP32 Asistencia"); 

  pBLEScan = BLEDevice::getScan();

  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertiseDeviceCallBacks()); 
  
  pBLEScan->setActiveScan(true); 
  pBLEScan->setInterval(100);
  pBLEScan->setWindow(99);

}

void loop() {
  
  Serial.println("--- Escaneando el area... ---");

  BLEScanResults* foundDevices = pBLEScan->start(scanTime, false); //Escanea por 5 segundos

  Serial.print("Total de dispositivos encontrados en esta ronda: "); // Lo cambié a print normal para que el número salga en la misma línea
  Serial.println(foundDevices->getCount());

  pBLEScan->clearResults(); //esto borra la memoria para evitar saturar Ram
  delay(2000);
}
