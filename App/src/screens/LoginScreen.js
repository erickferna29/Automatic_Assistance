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
import { loginUniversal } from '../services/teacherApi';

const LoginScreen = ({ navigation }) => {
  const [noCuenta, setNoCuenta] = useState('');
  const [nip, setNip]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [nipVisible, setNipVisible] = useState(false);

  const handleLogin = async () => {
    if (!noCuenta.trim()) {
      Alert.alert('Campo requerido', 'Ingresa tu número de cuenta o empleado.');
      return;
    }

    // Profesores no tienen NIP en la BD — si el número es corto (≤5 dígitos),
    // el NIP es opcional. El backend detecta el tipo automáticamente.
    if (!nip.trim()) {
  Alert.alert('Campo requerido', 'Ingresa tu NIP de acceso.');
  return;
}

    setLoading(true);
    try {
      const resultado = await loginUniversal(noCuenta.trim(), nip.trim());

      if (!resultado.success) {
        Alert.alert('Acceso denegado', resultado.message || 'Credenciales incorrectas.');
        return;
      }

      if (resultado.tipo === 'profesor') {
        // ── Profesor → Dashboard ──────────────────────────────
        navigation.navigate('Dashboard', { profesor: resultado.usuario });
      } else {
        // ── Alumno → flujo existente de permisos/foto ─────────
        navigation.navigate('Permissions', { usuario: resultado.usuario });
      }

    } catch (error) {
      Alert.alert('Error de conexión', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetNip = () => {
    Alert.alert(
      'Obtener NIP',
      'Comunícate con el administrador del sistema o visita la oficina más cercana.',
      [{ text: 'Entendido', style: 'default' }]
    );
  };

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
          <Text style={styles.appSubtitle}>Sistema de Asistencia Automática</Text>
        </View>

        {/* ── CARD ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar Sesión</Text>
          <Text style={styles.cardSubtitle}>
            Alumnos: número de cuenta + NIP{'\n'}
            Profesores: solo número de empleado
          </Text>

          {/* No. Cuenta / No. Empleado */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número de Cuenta / Empleado</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🪪</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 17001 (profe) o 24133876 (alumno)"
                placeholderTextColor="#8A9BB5"
                value={noCuenta}
                onChangeText={setNoCuenta}
                keyboardType="numeric"
                maxLength={20}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* NIP */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NIP de Acceso (solo alumnos)</Text>
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

          {/* Botón Acceder */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Acceder</Text>
                <Text style={styles.loginButtonArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Registro */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>¿Primera vez?</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}>
            <Text style={styles.registerButtonText}>📋 Registrar NIP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nipLinkButton, { marginTop: 10 }]}
            onPress={handleGetNip}
            activeOpacity={0.7}>
            <Text style={styles.nipLinkText}>🔑 Obtener NIP de acceso</Text>
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

  card: {
    width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 16,
  },
  cardTitle:    { fontSize: 22, fontWeight: '800', color: '#000000', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: '#5A6A85', marginBottom: 24, lineHeight: 18 },

  inputGroup:   { marginBottom: 18 },
  label:        { fontSize: 12, fontWeight: '700', color: '#000000', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0F4FF', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#D0DAF0',
    paddingHorizontal: 14, height: 52,
  },
  inputIcon:  { fontSize: 16, marginRight: 10 },
  input:      { flex: 1, fontSize: 16, color: '#000000', fontWeight: '500', paddingVertical: 0 },
  eyeButton:  { padding: 4 },
  eyeIcon:    { fontSize: 18 },

  loginButton: {
    flexDirection: 'row', backgroundColor: '#001F6D', borderRadius: 14,
    height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 8,
    shadowColor: '#001F6D', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText:  { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1, textTransform: 'uppercase' },
  loginButtonArrow: { fontSize: 20, color: '#FFFFFF', marginLeft: 10, fontWeight: '300' },

  orRow:    { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  orLine:   { flex: 1, height: 1, backgroundColor: '#E0E8F5' },
  orText:   { fontSize: 12, color: '#8A9BB5', marginHorizontal: 12, fontWeight: '500' },

  registerButton: {
    alignItems: 'center', paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#001F6D15', borderWidth: 1, borderColor: '#001F6D40',
  },
  registerButtonText: { fontSize: 14, color: '#001F6D', fontWeight: '700' },

  nipLinkButton: {
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: 12, backgroundColor: '#F0F4FF',
    borderWidth: 1, borderColor: '#C8D8F0', borderStyle: 'dashed',
  },
  nipLinkText: { fontSize: 14, color: '#001F6D', fontWeight: '700', letterSpacing: 0.3 },

  footer: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 28, letterSpacing: 0.5 },
});

export default LoginScreen;
