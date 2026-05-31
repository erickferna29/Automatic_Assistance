import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Alert,
} from 'react-native';
// 1. IMPORTAMOS EL EMISOR BLUETOOTH
import BLEAdvertiser from 'react-native-ble-advertiser';
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';

// ── COMPONENTE: Logo animado de "enviando señal"
const SignalIcon = () => {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animateRing = (anim, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animateRing(ring1, 0).start();
    animateRing(ring2, 600).start();
    animateRing(ring3, 1200).start();
    pulseAnim.start();
  }, [pulse, ring1, ring2, ring3]);

  const ringStyle = anim => ({
    opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 0.3, 0] }),
    transform: [
      {
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }),
      },
    ],
  });

  return (
    <View style={signalStyles.wrapper}>
      <Animated.View style={[signalStyles.ring, signalStyles.ring1, ringStyle(ring1)]} />
      <Animated.View style={[signalStyles.ring, signalStyles.ring2, ringStyle(ring2)]} />
      <Animated.View style={[signalStyles.ring, signalStyles.ring3, ringStyle(ring3)]} />
      <Animated.View style={[signalStyles.center, { transform: [{ scale: pulse }] }]}>
        <Text style={signalStyles.centerEmoji}>📶</Text>
      </Animated.View>
    </View>
  );
};

const signalStyles = StyleSheet.create({
  wrapper: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  ring: { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#4A90FF' },
  ring1: {}, ring2: {}, ring3: {},
  center: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#001F6D', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#4A90FF', shadowColor: '#4A90FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15, elevation: 12 },
  centerEmoji: { fontSize: 32 },
});

// ── PANTALLA PRINCIPAL DE BIENVENIDA
const WelcomeScreen = ({ navigation, route }) => {
  const { usuario } = route.params;
  const [statusMsg, setStatusMsg] = useState('Conectando al sistema...');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [step, setStep] = useState(0);

  const statusMessages = [
    'Conectando al sistema...',
    'Autenticando usuario...',
    'Verificando registro...',
    'Enviando señal de asistencia...',
    '¡Asistencia en proceso!',
  ];

  useEffect(() => {
    // 1. Animaciones visuales
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();

    // 2. LÓGICA DE TRANSMISIÓN BLUETOOTH REAL
  const iniciarTransmisionBLE = async () => {
    try {
      // ── VERIFICAR PERMISO BLUETOOTH_ADVERTISE ANTES DE TRANSMITIR
      if (Platform.OS === 'android' && parseInt(Platform.Version, 10) >= 31) {
        const advertiseStatus = await check(PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE);
        if (advertiseStatus !== RESULTS.GRANTED) {
          console.warn('[BLE] Permiso BLUETOOTH_ADVERTISE no concedido:', advertiseStatus);
          // Regresar al flujo de permisos en lugar de crashear
          navigation.navigate('Permissions', { usuario });
          return;
        }
            }
      const noCuenta = String(usuario?.no_cuenta || '00000000');
      const dataBytes = noCuenta.split('').map(d => Number(d));
      const UUID = '1A2B3C4D-5E6F-7A8B-9C0D-1E2F3A4B5C6D';

      BLEAdvertiser.setCompanyId(0x00E0);

      await BLEAdvertiser.broadcast(UUID, dataBytes, {
        advertiseMode: BLEAdvertiser.ADVERTISE_MODE_BALANCED,
        txPowerLevel: BLEAdvertiser.ADVERTISE_TX_POWER_HIGH,
        connectable: false,
        includeDeviceName: false, // ← cambia a false por ahora, reduce payload y permisos necesarios
        includeTxPowerLevel: false,
      });

      console.log('[BLE] Transmitiendo cuenta:', noCuenta);
    } catch (error) {
      console.error('[BLE] Error al iniciar transmisión:', error);
    }
  };

    iniciarTransmisionBLE();

    // 3. Ciclo de mensajes de estado
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < statusMessages.length) {
        setStatusMsg(statusMessages[currentStep]);
        setStep(currentStep);
      } else {
        clearInterval(interval);
      }
    }, 1800);

    // 4. Apagar la antena al desmontar la pantalla (Cerrar sesión)
    return () => {
      clearInterval(interval);
      BLEAdvertiser.stopBroadcast()
        .then(() => console.log('[BLE] Antena apagada.'))
        .catch(err => console.error('[BLE] Error apagando:', err));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Deseas cerrar sesión en Automatic Assistence?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => navigation.navigate('Login'),
        },
      ],
    );
  };

const nombreCompleto = (
  usuario?.nombre ||
  `${usuario?.nombres ?? ''} ${usuario?.apellido_paterno ?? ''} ${usuario?.apellido_materno ?? ''}`.trim() ||
  'Usuario'
);

const primerNombre = nombreCompleto.split(' ')[0];
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.logoSmall}><Text style={styles.logoSmallText}>A</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Automatic Assistence</Text>
          <Text style={styles.headerSubtitle}>Sistema activo y en línea</Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineBadgeText}>En línea</Text>
        </View>
      </View>

      {/* Contenido principal */}
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.greetingSection}>
          <Text style={styles.greetingSmall}>Bienvenido de vuelta,</Text>
          <Text style={styles.greetingName}>{primerNombre}</Text>
          <Text style={styles.greetingFull}>{usuario?.nombre || 'Usuario'}</Text>
        </View>

        <View style={styles.signalSection}>
          <SignalIcon />
          <Text style={styles.signalLabel}>Enviando Señal de Asistencia</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusDots}>
            {statusMessages.map((_, i) => (
              <View key={i} style={[styles.statusDot, i <= step && styles.statusDotActive, i === step && styles.statusDotCurrent]} />
            ))}
          </View>
          <Text style={styles.statusMessage}>{statusMsg}</Text>
        </View>

        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{primerNombre.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{usuario?.nombre || 'N/A'}</Text>
            <Text style={styles.userAccount}>Cuenta: {usuario?.no_cuenta || 'N/A'}</Text>
          </View>
          <View style={styles.userStatusBadge}><Text style={styles.userStatusText}>✓ Activo</Text></View>
        </View>

        <Text style={styles.timestamp}>
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}{'\n'}
          {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </Text>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  headerBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#001F6D', paddingTop: 48, paddingBottom: 16, paddingHorizontal: 20 },
  logoSmall: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logoSmallText: { fontSize: 18, fontWeight: '900', color: '#001F6D' },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,200,100,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,200,100,0.4)' },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00C864', marginRight: 5 },
  onlineBadgeText: { fontSize: 11, fontWeight: '700', color: '#00C864' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32, alignItems: 'center' },
  greetingSection: { alignItems: 'center', marginBottom: 28 },
  greetingSmall: { fontSize: 13, color: '#555577', fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase' },
  greetingName: { fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1, marginTop: 2 },
  greetingFull: { fontSize: 14, color: '#8A9BB5', fontWeight: '400', marginTop: -2 },
  signalSection: { alignItems: 'center', marginBottom: 24 },
  signalLabel: { fontSize: 12, color: '#4A90FF', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 12 },
  statusCard: { width: '100%', backgroundColor: '#050520', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#0D0D40', alignItems: 'center' },
  statusDots: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E1E3E' },
  statusDotActive: { backgroundColor: '#001F6D' },
  statusDotCurrent: { backgroundColor: '#4A90FF', shadowColor: '#4A90FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6, elevation: 4 },
  statusMessage: { fontSize: 13, color: '#8A9BB5', fontWeight: '500', textAlign: 'center' },
  userCard: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#050520', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#0D0D40' },
  userAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#001F6D', justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 2, borderColor: '#4A90FF' },
  userAvatarText: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  userAccount: { fontSize: 12, color: '#555577', marginTop: 2 },
  userStatusBadge: { backgroundColor: 'rgba(0,200,100,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,200,100,0.3)' },
  userStatusText: { fontSize: 11, fontWeight: '700', color: '#00C864' },
  timestamp: { fontSize: 12, color: '#333355', textAlign: 'center', lineHeight: 19, marginBottom: 24, textTransform: 'capitalize' },
  signOutBtn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 30, borderWidth: 1, borderColor: '#1E1E3E' },
  signOutText: { fontSize: 13, color: '#444466', fontWeight: '600' },
});

export default WelcomeScreen;