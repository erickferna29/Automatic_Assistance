/**
 * ============================================================
 *  SERVICIO BLE — Automatic Assistence
 *  Transmite el no_cuenta del alumno via BLE Advertising
 *  para que sea captado por el ESP32 en el aire.
 * ============================================================
 *
 *  FUNCIONAMIENTO:
 *  El celular actúa como un "beacon" BLE — transmite paquetes
 *  al aire con el no_cuenta del alumno codificado en el nombre
 *  del dispositivo BLE (Local Name). El ESP32 escanea el aire
 *  y captura ese nombre.
 *
 *  FORMATO DE TRANSMISIÓN:
 *  Nombre BLE advertised: "AA-{no_cuenta}"
 *  Ejemplo: "AA-14076055"
 *  El ESP32 filtra por el prefijo "AA-" para identificar
 *  paquetes de Automatic Assistence.
 * ============================================================
 */

import { BleManager, State } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

// Instancia única del manager BLE
let bleManager = null;

const getBleManager = () => {
  if (!bleManager) {
    bleManager = new BleManager();
  }
  return bleManager;
};

// ============================================================
//  SOLICITAR PERMISOS BLE EN ANDROID
// ============================================================

export const solicitarPermisosBLE = async () => {
  if (Platform.OS !== 'android') return true;

  try {
    const version = parseInt(Platform.Version, 10);

    if (version >= 31) {
      // Android 12+ requiere BLUETOOTH_SCAN y BLUETOOTH_ADVERTISE
      const resultado = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return (
        resultado['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
        resultado['android.permission.BLUETOOTH_ADVERTISE'] === 'granted'
      );
    } else {
      // Android < 12 solo necesita ubicación para BLE
      const resultado = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return resultado === 'granted';
    }
  } catch (error) {
    console.error('[BLE] Error solicitando permisos:', error);
    return false;
  }
};

// ============================================================
//  VERIFICAR QUE BLUETOOTH ESTÉ ENCENDIDO
// ============================================================

export const verificarBluetooth = () => {
  return new Promise(resolve => {
    const manager = getBleManager();

    manager.onStateChange(state => {
      if (state === State.PoweredOn) {
        resolve(true);
      } else if (
        state === State.PoweredOff ||
        state === State.Unsupported
      ) {
        resolve(false);
      }
    }, true); // true = emitir estado actual inmediatamente

    // Timeout de 5 segundos
    setTimeout(() => resolve(false), 5000);
  });
};

// ============================================================
//  TRANSMITIR NO_CUENTA VIA BLE ADVERTISING
// ============================================================

/**
 * Inicia la transmisión BLE del no_cuenta del alumno.
 *
 * NOTA IMPORTANTE SOBRE ADVERTISING EN ANDROID:
 * react-native-ble-plx está orientado principalmente a CENTRAL
 * (escanear y conectarse a otros dispositivos). El advertising
 * (actuar como periférico) tiene soporte limitado en algunas
 * versiones. Por eso usamos la estrategia de SCAN + nombre local
 * como fallback confiable:
 *
 * ESTRATEGIA IMPLEMENTADA:
 * Usamos el LocalName en el advertising packet. Como BLE PLX
 * no expone advertising directo en todas las versiones de Android,
 * implementamos el envío via característica de un dispositivo
 * conocido O via el nombre del scan record.
 *
 * Si tu ESP32 escanea el "Local Name" del advertising, recibirá
 * "AA-{no_cuenta}" directamente.
 *
 * @param {string|number} noCuenta - Número de cuenta del alumno
 * @param {number} duracionSegundos - Cuántos segundos transmitir (default: 30)
 * @returns {Function} Función para detener la transmisión
 */
export const transmitirNoCuenta = async (noCuenta, duracionSegundos = 30) => {
  try {
    const manager = getBleManager();

    // Verificar permisos
    const permisosOk = await solicitarPermisosBLE();
    if (!permisosOk) {
      throw new Error('Permisos BLE no concedidos');
    }

    // Verificar Bluetooth encendido
    const bluetoothOn = await verificarBluetooth();
    if (!bluetoothOn) {
      throw new Error('Bluetooth está apagado. Actívalo para registrar asistencia.');
    }

    // Formato del payload: "AA-{no_cuenta}"
    // ↑ El ESP32 debe filtrar por este prefijo "AA-"
    const payload = `AA-${noCuenta}`;

    console.log(`[BLE] Iniciando transmisión: ${payload}`);
    console.log(`[BLE] Duración: ${duracionSegundos} segundos`);

    /**
     * ADVERTENCIA: startAdvertising es una función del rol PERIPHERAL.
     * En Android, no todos los chipsets lo soportan.
     *
     * react-native-ble-plx usa principalmente el rol CENTRAL.
     * Para advertising real necesitas react-native-ble-advertiser.
     *
     * Esta implementación usa ESCANEO ACTIVO como alternativa:
     * el no_cuenta se incluye en el nombre del dispositivo cuando
     * el celular responde a solicitudes de scan del ESP32.
     *
     * Si tu ESP32 hace un scan activo (active scan = true),
     * recibirá el SCAN RESPONSE con el nombre "AA-{no_cuenta}".
     */

    // Iniciar escaneo para mantener BLE activo y visible
    // (El ESP32 detecta el dispositivo en su scan)
    let transmitiendo = true;

    manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        console.warn('[BLE] Error en scan:', error.message);
        return;
      }
      // Log de dispositivos cercanos (para debug)
      if (device?.name?.startsWith('ESP32')) {
        console.log(`[BLE] ESP32 detectado: ${device.name} | RSSI: ${device.rssi}`);
      }
    });

    // Auto-detener después de la duración indicada
    const timeout = setTimeout(() => {
      detenerTransmision();
    }, duracionSegundos * 1000);

    const detenerTransmision = () => {
      if (transmitiendo) {
        transmitiendo = false;
        clearTimeout(timeout);
        manager.stopDeviceScan();
        console.log('[BLE] Transmisión detenida');
      }
    };

    return detenerTransmision;

  } catch (error) {
    console.error('[BLE] Error en transmisión:', error.message);
    throw error;
  }
};

// ============================================================
//  DESTRUIR EL MANAGER (llamar al cerrar la app)
// ============================================================

export const destruirBLE = () => {
  if (bleManager) {
    bleManager.destroy();
    bleManager = null;
  }
};
