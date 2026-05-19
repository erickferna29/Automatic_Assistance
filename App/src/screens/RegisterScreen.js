import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import apiClient from '../services/api';

const RegisterScreen = ({ navigation }) => {
  const [noCuenta, setNoCuenta]       = useState('');
  const [nip, setNip]                 = useState('');
  const [confirmarNip, setConfirmarNip] = useState('');
  const [loading, setLoading]         = useState(false);
  const [nipVisible, setNipVisible]   = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  // ── Validaciones locales ──────────────────────────────────────────────────
  const validar = () => {
    if (!noCuenta.trim()) {
      Alert.alert('Campo requerido', 'Ingresa tu número de cuenta.');
      return false;
    }
    if (nip.length < 4) {
      Alert.alert('NIP muy corto', 'El NIP debe tener al menos 4 dígitos.');
      return false;
    }
    if (nip !== confirmarNip) {
      Alert.alert('NIP no coincide', 'Los dos NIPs que ingresaste son diferentes.');
      return false;
    }
    return true;
  };

  // ── Registro ──────────────────────────────────────────────────────────────
  const handleRegistrar = async () => {
    if (!validar()) return;

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/registro', {
        no_cuenta: noCuenta.trim(),
        nip: nip.trim(),
      });

      const resultado = response.data;

      if (!resultado.success) {
        Alert.alert('No se pudo registrar', resultado.message || 'Verifica tus datos.');
        return;
      }

      // Registro exitoso → ir a permisos para tomar foto
      Alert.alert(
        '✅ NIP registrado',
        'Tu acceso quedó configurado. Ahora tomaremos tu foto de identificación.',
        [
          {
            text: 'Continuar',
            onPress: () =>
              navigation.navigate('Permissions', { usuario: resultado.usuario }),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      Alert.alert(
        'Error de conexión',
        error.message + '\n\nVerifica que el servidor esté disponible.',
      );
    } finally {
      setLoading(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#001F6D" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">

        {/* ── ENCABEZADO ── */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoOuter}>
              <View style={styles.logoInner}>
                <Text style={styles.logoSymbol}>A</Text>
              </View>
            </View>
          </View>
          <Text style={styles.appName}>Automatic</Text>
          <Text style={styles.appNameBold}>Assistence</Text>
          <View style={styles.dividerLine} />
          <Text style={styles.appSubtitle}>Registro de Alumno</Text>
        </View>

        {/* ── CARD ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Crear NIP de Acceso</Text>
          <Text style={styles.cardSubtitle}>
            Si es tu primera vez, ingresa tu número de cuenta{'\n'}
            y elige un NIP para acceder a la app.
          </Text>

          {/* No. Cuenta */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número de Cuenta</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🪪</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 24133876"
                placeholderTextColor="#8A9BB5"
                value={noCuenta}
                onChangeText={setNoCuenta}
                keyboardType="numeric"
                maxLength={20}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* NIP nuevo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nuevo NIP (mínimo 4 dígitos)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••"
                placeholderTextColor="#8A9BB5"
                value={nip}
                onChangeText={setNip}
                secureTextEntry={!nipVisible}
                keyboardType="numeric"
                maxLength={10}
              />
              <TouchableOpacity
                onPress={() => setNipVisible(!nipVisible)}
                style={styles.eyeButton}>
                <Text style={styles.eyeIcon}>{nipVisible ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmar NIP */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar NIP</Text>
            <View style={[
              styles.inputWrapper,
              confirmarNip.length > 0 && nip !== confirmarNip && styles.inputWrapperError,
              confirmarNip.length > 0 && nip === confirmarNip && styles.inputWrapperOk,
            ]}>
              <Text style={styles.inputIcon}>🔐</Text>
              <TextInput
                style={styles.input}
                placeholder="Repite tu NIP"
                placeholderTextColor="#8A9BB5"
                value={confirmarNip}
                onChangeText={setConfirmarNip}
                secureTextEntry={!confirmVisible}
                keyboardType="numeric"
                maxLength={10}
              />
              <TouchableOpacity
                onPress={() => setConfirmVisible(!confirmVisible)}
                style={styles.eyeButton}>
                <Text style={styles.eyeIcon}>{confirmVisible ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {confirmarNip.length > 0 && nip !== confirmarNip && (
              <Text style={styles.errorHint}>Los NIPs no coinciden</Text>
            )}
            {confirmarNip.length > 0 && nip === confirmarNip && (
              <Text style={styles.successHint}>✓ Los NIPs coinciden</Text>
            )}
          </View>

          {/* Botón Registrar */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleRegistrar}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.registerButtonText}>Registrar NIP</Text>
                <Text style={styles.registerButtonArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              📋 Después del registro tomarás una foto de identificación{'\n'}
              que se usará para el sistema de asistencia.
            </Text>
          </View>

          {/* Volver al login */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>¿Ya tienes NIP?</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}>
            <Text style={styles.loginLinkText}>← Volver al Inicio de Sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2024 Automatic Assistence · v1.0.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#001F6D' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32, alignItems: 'center' },

  // ── HEADER
  headerSection: { alignItems: 'center', marginBottom: 36 },
  logoContainer: { marginBottom: 16 },
  logoOuter: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  logoInner: {
    width: 66, height: 66, borderRadius: 33,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  logoSymbol:   { fontSize: 36, fontWeight: '900', color: '#001F6D', letterSpacing: -1 },
  appName:      { fontSize: 26, fontWeight: '300', color: 'rgba(255,255,255,0.85)', letterSpacing: 6, textTransform: 'uppercase' },
  appNameBold:  { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 4, textTransform: 'uppercase', marginTop: -4 },
  dividerLine:  { width: 60, height: 2, backgroundColor: 'rgba(255,255,255,0.4)', marginVertical: 10 },
  appSubtitle:  { fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, textTransform: 'uppercase' },

  // ── CARD
  card: {
    width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 16,
  },
  cardTitle:    { fontSize: 22, fontWeight: '800', color: '#000000', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: '#5A6A85', marginBottom: 24, lineHeight: 18 },

  // ── INPUTS
  inputGroup:   { marginBottom: 18 },
  label:        { fontSize: 12, fontWeight: '700', color: '#000000', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0F4FF', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#D0DAF0',
    paddingHorizontal: 14, height: 52,
  },
  inputWrapperError: { borderColor: '#FF3B30', backgroundColor: '#FFF5F5' },
  inputWrapperOk:    { borderColor: '#34C759', backgroundColor: '#F5FFF8' },
  inputIcon:    { fontSize: 16, marginRight: 10 },
  input:        { flex: 1, fontSize: 16, color: '#000000', fontWeight: '500', paddingVertical: 0 },
  eyeButton:    { padding: 4 },
  eyeIcon:      { fontSize: 18 },
  errorHint:    { fontSize: 11, color: '#FF3B30', marginTop: 5, marginLeft: 4 },
  successHint:  { fontSize: 11, color: '#34C759', marginTop: 5, marginLeft: 4 },

  // ── BOTÓN PRINCIPAL
  registerButton: {
    flexDirection: 'row', backgroundColor: '#001F6D', borderRadius: 14,
    height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 8,
    shadowColor: '#001F6D', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  buttonDisabled:      { opacity: 0.7 },
  registerButtonText:  { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1, textTransform: 'uppercase' },
  registerButtonArrow: { fontSize: 20, color: '#FFFFFF', marginLeft: 10, fontWeight: '300' },

  // ── INFO BOX
  infoBox: {
    backgroundColor: '#EEF2FF', borderRadius: 12, padding: 14,
    marginTop: 16, borderWidth: 1, borderColor: '#C8D4F0',
  },
  infoText: { fontSize: 12, color: '#3A5080', lineHeight: 18, textAlign: 'center' },

  // ── OR / FOOTER
  orRow:    { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  orLine:   { flex: 1, height: 1, backgroundColor: '#E0E8F5' },
  orText:   { fontSize: 12, color: '#8A9BB5', marginHorizontal: 12, fontWeight: '500' },

  loginLink: {
    alignItems: 'center', paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#001F6D15', borderWidth: 1, borderColor: '#001F6D40',
  },
  loginLinkText: { fontSize: 14, color: '#001F6D', fontWeight: '700' },

  footer: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 28, letterSpacing: 0.5 },
});

export default RegisterScreen;