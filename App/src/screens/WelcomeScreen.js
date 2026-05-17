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
import { transmitirNoCuenta, destruirBLE } from '../services/bleService';

// ── COMPONENTE: Anillos de señal BLE animados
const SignalIcon = ({ activo }) => {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animateRing = (anim, delay) =>
      Animated.loop(
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

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    if (activo) {
      animateRing(ring1, 0).start();
      animateRing(ring2, 600).start();
      animateRing(ring3, 1200).start();
      pulseAnim.start();
    }
  }, [activo, pulse, ring1, ring2, ring3]);

  const ringStyle = anim => ({
    opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.9, 0.3, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }) }],
  });

  const centerColor = activo ? '#001F6D' : '#1A1A2E';
  const borderColor = activo ? '#4A90FF' : '#333355';

  return (
    <View style={signalStyles.wrapper}>
      {activo && (
        <>
          <Animated.View style={[signalStyles.ring, ringStyle(ring1)]} />
          <Animated.View style={[signalStyles.ring, ringStyle(ring2)]} />
          <Animated.View style={[signalStyles.ring, ringStyle(ring3)]} />
        </>
      )}
      <Animated.View
        style={[
          signalStyles.center,
          { backgroundColor: centerColor, borderColor },
          activo && { transform: [{ scale: pulse }] },
        ]}>
        <Text style={signalStyles.centerEmoji}>{activo ? '📶' : '📵'}</Text>
      </Animated.View>
    </View>
  );
};

const signalStyles = StyleSheet.create({
  wrapper: { width: 150, height: 150, justifyContent: 'center', alignItems: 'center' },
  ring: { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#4A90FF' },
  center: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 3, shadowColor: '#4A90FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15, elevation: 12 },
  centerEmoji: { fontSize: 32 },
});

const ESTADO = { INICIANDO: 'iniciando', TRANSMITIENDO: 'transmitiendo', COMPLETADO: 'completado', ERROR: 'error' };

const WelcomeScreen = ({ navigation, route }) => {
  const { usuario } = route.params;
  const [estadoBLE, setEstadoBLE] = useState(ESTADO.INICIANDO);
  const [segundosRestantes, setSegundosRestantes] = useState(30);
  const [mensajeEstado, setMensajeEstado] = useState('Iniciando transmisión BLE...');
  const detenerBLERef = useRef(null);
  const timerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const nombreCompleto = usuario?.nombre ||
    `${usuario?.nombres || ''} ${usuario?.apellido_paterno || ''} ${usuario?.apellido_materno || ''}`.trim();
  const primerNombre = nombreCompleto.split(' ')[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();
    iniciarTransmisionBLE();
    return () => {
      if (detenerBLERef.current) detenerBLERef.current();
      if (timerRef.current) clearInterval(timerRef.current);
      destruirBLE();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iniciarTransmisionBLE = async () => {
    try {
      setEstadoBLE(ESTADO.INICIANDO);
      setMensajeEstado('Iniciando transmisión BLE...');
      const detener = await transmitirNoCuenta(usuario.no_cuenta, 30);
      detenerBLERef.current = detener;
      setEstadoBLE(ESTADO.TRANSMITIENDO);
      setMensajeEstado('Transmitiendo No. Cuenta al ESP32...');
      let segundos = 30;
      timerRef.current = setInterval(() => {
        segundos--;
        setSegundosRestantes(segundos);
        if (segundos <= 0) {
          clearInterval(timerRef.current);
          setEstadoBLE(ESTADO.COMPLETADO);
          setMensajeEstado('✅ Asistencia registrada correctamente');
        }
      }, 1000);
    } catch (error) {
      setEstadoBLE(ESTADO.ERROR);
      setMensajeEstado(`Error BLE: ${error.message}`);
      Alert.alert('Error Bluetooth', error.message + '\n\nAsegúrate de que el Bluetooth esté activado.');
    }
  };

  const retransmitir = () => {
    if (detenerBLERef.current) detenerBLERef.current();
    if (timerRef.current) clearInterval(timerRef.current);
    setSegundosRestantes(30);
    iniciarTransmisionBLE();
  };

  const handleSignOut = () => {
    if (detenerBLERef.current) detenerBLERef.current();
    Alert.alert('Cerrar sesión', '¿Deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => navigation.navigate('Login') },
    ]);
  };

  const badgeConfig = {
    [ESTADO.INICIANDO]:     { color: '#FFB800', texto: '⏳ Iniciando...' },
    [ESTADO.TRANSMITIENDO]: { color: '#4A90FF', texto: '📡 Transmitiendo' },
    [ESTADO.COMPLETADO]:    { color: '#00C864', texto: '✓ Completado' },
    [ESTADO.ERROR]:         { color: '#FF4444', texto: '✕ Error BLE' },
  };
  const badge = badgeConfig[estadoBLE];

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View style={styles.logoSmall}><Text style={styles.logoSmallText}>A</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Automatic Assistence</Text>
          <Text style={styles.headerSubtitle}>Transmisión BLE activa</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: badge.color }]}>
          <View style={[styles.statusDot, { backgroundColor: badge.color }]} />
          <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.texto}</Text>
        </View>
      </View>

      <Animated.ScrollView contentContainerStyle={styles.content} style={{ opacity: fadeAnim }}>
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.greetingSmall}>Bienvenido,</Text>
          <Text style={styles.greetingName}>{primerNombre}</Text>
          <Text style={styles.greetingFull}>{nombreCompleto}</Text>
        </Animated.View>

        <View style={styles.signalSection}>
          <SignalIcon activo={estadoBLE === ESTADO.TRANSMITIENDO || estadoBLE === ESTADO.INICIANDO} />
          {estadoBLE === ESTADO.TRANSMITIENDO && (
            <View style={styles.countdownBox}>
              <Text style={styles.countdownNumber}>{segundosRestantes}</Text>
              <Text style={styles.countdownLabel}>segundos restantes</Text>
            </View>
          )}
          <Text style={styles.signalLabel}>{mensajeEstado}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📡 Señal BLE en Transmisión</Text>
          <View style={styles.infoRow}><Text style={styles.infoKey}>Protocolo</Text><Text style={styles.infoVal}>Bluetooth Low Energy</Text></View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}><Text style={styles.infoKey}>No. Cuenta</Text><Text style={[styles.infoVal, styles.infoValHighlight]}>{usuario?.no_cuenta}</Text></View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}><Text style={styles.infoKey}>Payload</Text><Text style={[styles.infoVal, styles.infoValCode]}>AA-{usuario?.no_cuenta}</Text></View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}><Text style={styles.infoKey}>Receptor</Text><Text style={styles.infoVal}>ESP32 Scanner</Text></View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}><Text style={styles.infoKey}>Carrera</Text><Text style={styles.infoVal}>{usuario?.carrera || 'N/A'}</Text></View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}><Text style={styles.infoKey}>Grupo / Grado</Text><Text style={styles.infoVal}>{usuario?.grupo || 'N/A'} — {usuario?.grado || 'N/A'}° Sem.</Text></View>
        </View>

        <Text style={styles.timestamp}>
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {'\n'}
          {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </Text>

        {(estadoBLE === ESTADO.COMPLETADO || estadoBLE === ESTADO.ERROR) && (
          <TouchableOpacity style={styles.btnRetransmit} onPress={retransmitir} activeOpacity={0.85}>
            <Text style={styles.btnRetransmitText}>📡 Retransmitir señal</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
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
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  content: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40, alignItems: 'center' },
  greetingSmall: { fontSize: 13, color: '#555577', fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center' },
  greetingName: { fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1, marginTop: 2, textAlign: 'center' },
  greetingFull: { fontSize: 13, color: '#8A9BB5', fontWeight: '400', marginTop: -2, textAlign: 'center', marginBottom: 24 },
  signalSection: { alignItems: 'center', marginBottom: 20 },
  countdownBox: { alignItems: 'center', marginTop: 8 },
  countdownNumber: { fontSize: 48, fontWeight: '900', color: '#4A90FF', lineHeight: 52 },
  countdownLabel: { fontSize: 11, color: '#555577', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 },
  signalLabel: { fontSize: 12, color: '#4A90FF', fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 10, textAlign: 'center' },
  infoCard: { width: '100%', backgroundColor: '#050520', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#0D0D40' },
  infoTitle: { fontSize: 13, fontWeight: '800', color: '#FFFFFF', marginBottom: 14, textAlign: 'center', letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  infoDivider: { height: 1, backgroundColor: '#0D0D30' },
  infoKey: { fontSize: 12, color: '#555577', fontWeight: '600', flex: 1 },
  infoVal: { fontSize: 12, color: '#AABBCC', fontWeight: '500', flex: 1, textAlign: 'right' },
  infoValHighlight: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  infoValCode: { color: '#4A90FF', fontWeight: '700' },
  timestamp: { fontSize: 12, color: '#333355', textAlign: 'center', lineHeight: 19, marginBottom: 20, textTransform: 'capitalize' },
  btnRetransmit: { width: '100%', backgroundColor: '#001F6D', borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 8 },
  btnRetransmitText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  signOutBtn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 30, borderWidth: 1, borderColor: '#1E1E3E' },
  signOutText: { fontSize: 13, color: '#444466', fontWeight: '600' },
});

export default WelcomeScreen;
