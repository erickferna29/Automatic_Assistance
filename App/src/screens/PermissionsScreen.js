import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { request, requestMultiple, PERMISSIONS, RESULTS } from 'react-native-permissions';

const PermissionsScreen = ({ navigation, route }) => {
  const { usuario } = route.params;
  const [bluetoothGranted, setBluetoothGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestBluetooth = async () => {
    try {
      let permissions = [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION];

      // Si es Android 12 (API 31) o superior, pide permisos modernos
      if (Platform.OS === 'android' && parseInt(Platform.Version, 10) >= 31) {
        permissions = [
          PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE,
          PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
          PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        ];
      }

      const results = await requestMultiple(permissions);
      // Verifica que todos hayan sido concedidos
      return Object.values(results).every(res => res === RESULTS.GRANTED);
    } catch (e) {
      return false;
    }
  };

  const requestCamera = async () => {
    try {
      const permission =
        Platform.OS === 'android'
          ? PERMISSIONS.ANDROID.CAMERA
          : PERMISSIONS.IOS.CAMERA;

      const result = await request(permission);
      if (result === RESULTS.GRANTED) {
        setCameraGranted(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleAcceptAll = async () => {
    setLoading(true);

    const btOk = await requestBluetooth();
    const camOk = await requestCamera();

    setLoading(false);

    if (btOk && camOk) {
      // Ambos permisos concedidos → verificamos si ya tiene foto
      if (!usuario.foto_url) {
        // No tiene foto (es null), lo mandamos a tomarla
        navigation.navigate('PhotoCapture', { usuario });
      } else {
        // Ya tiene foto, nos saltamos la cámara y vamos al Dashboard
        navigation.navigate('Dashboard', { usuario });
      }
    } else {
      // Al menos uno denegado → pantalla de permisos requeridos
      navigation.navigate('PermissionsDenied');
    }
  };

  const handleDeny = () => {
    navigation.navigate('PermissionsDenied');
  };

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.headerBar}>
        <View style={styles.logoSmall}>
          <Text style={styles.logoSmallText}>A</Text>
        </View>
        <Text style={styles.headerTitle}>Automatic Assistence</Text>
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        <Text style={styles.greeting}>Hola,</Text>
        <Text style={styles.userName}>{usuario?.nombre || 'Usuario'}</Text>

        <View style={styles.iconBig}>
          <Text style={styles.iconBigEmoji}>🛡️</Text>
        </View>

        <Text style={styles.title}>Permisos Necesarios</Text>
        <Text style={styles.subtitle}>
          Para brindarte el mejor servicio, la aplicación necesita acceso a los
          siguientes recursos de tu dispositivo.
        </Text>

        {/* Tarjeta Bluetooth */}
        <View style={[styles.permCard, bluetoothGranted && styles.permCardGranted]}>
          <View style={styles.permIconWrap}>
            <Text style={styles.permEmoji}>📡</Text>
          </View>
          <View style={styles.permInfo}>
            <Text style={styles.permTitle}>Bluetooth</Text>
            <Text style={styles.permDesc}>
              Requerido para enviar señal de asistencia al sistema.
            </Text>
          </View>
          <View style={[styles.permStatus, bluetoothGranted && styles.permStatusOk]}>
            <Text style={styles.permStatusText}>
              {bluetoothGranted ? '✓' : '○'}
            </Text>
          </View>
        </View>

        {/* Tarjeta Cámara */}
        <View style={[styles.permCard, cameraGranted && styles.permCardGranted]}>
          <View style={styles.permIconWrap}>
            <Text style={styles.permEmoji}>📷</Text>
          </View>
          <View style={styles.permInfo}>
            <Text style={styles.permTitle}>Cámara</Text>
            <Text style={styles.permDesc}>
              Necesaria para capturar tu foto de identificación.
            </Text>
          </View>
          <View style={[styles.permStatus, cameraGranted && styles.permStatusOk]}>
            <Text style={styles.permStatusText}>
              {cameraGranted ? '✓' : '○'}
            </Text>
          </View>
        </View>

        {/* Nota */}
        <Text style={styles.note}>
          ⚠️ Ambos permisos son obligatorios para usar la aplicación.
        </Text>

        {/* Botones */}
        <TouchableOpacity
          style={[styles.btnAccept, loading && styles.btnDisabled]}
          onPress={handleAcceptAll}
          disabled={loading}
          activeOpacity={0.85}>
          <Text style={styles.btnAcceptText}>
            {loading ? 'Solicitando permisos...' : 'Permitir y Continuar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnDeny}
          onPress={handleDeny}
          activeOpacity={0.7}>
          <Text style={styles.btnDenyText}>No permitir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // ── HEADER BAR
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001F6D',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  logoSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoSmallText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#001F6D',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // ── CONTENIDO
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 16,
    color: '#8A9BB5',
    fontWeight: '400',
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  iconBig: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  iconBigEmoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#8A9BB5',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },

  // ── TARJETAS DE PERMISO
  permCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#1E1E2E',
  },
  permCardGranted: {
    borderColor: '#001F6D',
    backgroundColor: '#010E35',
  },
  permIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#001A5C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  permEmoji: {
    fontSize: 22,
  },
  permInfo: {
    flex: 1,
  },
  permTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  permDesc: {
    fontSize: 12,
    color: '#8A9BB5',
    lineHeight: 17,
  },
  permStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#3A3A5C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permStatusOk: {
    borderColor: '#001F6D',
    backgroundColor: '#001F6D',
  },
  permStatusText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  note: {
    fontSize: 12,
    color: '#8A6A00',
    backgroundColor: '#1A1200',
    borderRadius: 10,
    padding: 12,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#2A2000',
  },

  // ── BOTONES
  btnAccept: {
    backgroundColor: '#001F6D',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#001F6D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnAcceptText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  btnDeny: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDenyText: {
    fontSize: 14,
    color: '#555577',
    fontWeight: '600',
  },
});

export default PermissionsScreen;
