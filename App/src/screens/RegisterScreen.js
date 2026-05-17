import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { registrarNip } from '../services/api';

const RegisterScreen = ({ navigation }) => {
  const [noCuenta, setNoCuenta] = useState('');
  const [nip, setNip] = useState('');
  const [nipConfirm, setNipConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [nipVisible, setNipVisible] = useState(false);
  const [nipConfirmVisible, setNipConfirmVisible] = useState(false);

  const nipMatch = nip.length > 0 && nipConfirm.length > 0 && nip === nipConfirm;
  const nipMismatch = nip.length > 0 && nipConfirm.length > 0 && nip !== nipConfirm;

  const handleRegistro = async () => {
    if (!noCuenta.trim() || !nip.trim() || !nipConfirm.trim()) {
      Alert.alert('Campos requeridos', 'Por favor llena todos los campos.');
      return;
    }
    if (nip !== nipConfirm) {
      Alert.alert('NIPs no coinciden', 'Los NIPs que ingresaste no son iguales.');
      return;
    }
    if (nip.length < 4) {
      Alert.alert('NIP muy corto', 'El NIP debe tener al menos 4 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const resultado = await registrarNip(noCuenta.trim(), nip, nipConfirm);
      if (resultado.success) {
        Alert.alert(
          '¡Registro exitoso! ✅',
          'Tu NIP fue registrado. Ahora puedes iniciar sesión.',
          [{ text: 'Ir al Login', onPress: () => navigation.navigate('Login') }],
        );
      } else {
        Alert.alert('Error', resultado.message);
      }
    } catch (error) {
      Alert.alert('Error de conexión', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Regresar</Text>
          </TouchableOpacity>
        </View>

        {/* Logo */}
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
          <Text style={styles.appSubtitle}>Registro de Usuario Nuevo</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Crear NIP de Acceso</Text>
          <Text style={styles.cardSubtitle}>
            Ingresa tu número de cuenta y establece un NIP de 4 a 10 dígitos.
          </Text>

          {/* No. Cuenta */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número de Cuenta</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🪪</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 14076055"
                placeholderTextColor="#8A9BB5"
                value={noCuenta}
                onChangeText={setNoCuenta}
                keyboardType="numeric"
                maxLength={15}
              />
            </View>
          </View>

          {/* NIP */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Establecer NIP</Text>
            <View style={[styles.inputWrapper, nipMismatch && styles.inputWrapperError]}>
              <Text style={styles.inputIcon}>🔑</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 4 dígitos"
                placeholderTextColor="#8A9BB5"
                value={nip}
                onChangeText={setNip}
                secureTextEntry={!nipVisible}
                keyboardType="numeric"
                maxLength={10}
              />
              <TouchableOpacity onPress={() => setNipVisible(!nipVisible)} style={styles.eyeButton}>
                <Text style={styles.eyeIcon}>{nipVisible ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmar NIP */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar NIP</Text>
            <View style={[
              styles.inputWrapper,
              nipMatch && styles.inputWrapperOk,
              nipMismatch && styles.inputWrapperError,
            ]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Repite tu NIP"
                placeholderTextColor="#8A9BB5"
                value={nipConfirm}
                onChangeText={setNipConfirm}
                secureTextEntry={!nipConfirmVisible}
                keyboardType="numeric"
                maxLength={10}
              />
              <TouchableOpacity onPress={() => setNipConfirmVisible(!nipConfirmVisible)} style={styles.eyeButton}>
                <Text style={styles.eyeIcon}>{nipConfirmVisible ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {nipMatch && (
              <Text style={styles.matchText}>✅ Los NIPs coinciden</Text>
            )}
            {nipMismatch && (
              <Text style={styles.mismatchText}>❌ Los NIPs no coinciden</Text>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ℹ️ Tu número de cuenta debe estar previamente registrado en el sistema por el administrador.
            </Text>
          </View>

          {/* Botón */}
          <TouchableOpacity
            style={[styles.registerButton, (loading || nipMismatch) && styles.registerButtonDisabled]}
            onPress={handleRegistro}
            disabled={loading || nipMismatch}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>Registrar NIP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}>
            <Text style={styles.loginLinkText}>
              ¿Ya tienes NIP? Inicia sesión
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2024 Automatic Assistence · v1.0.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001F6D' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32, alignItems: 'center' },

  headerBar: { width: '100%', paddingTop: 48, paddingBottom: 8, alignItems: 'flex-start' },
  backBtn: { paddingVertical: 6, paddingHorizontal: 2 },
  backBtnText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  headerSection: { alignItems: 'center', marginBottom: 28 },
  logoContainer: { marginBottom: 14 },
  logoOuter: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  logoInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  logoSymbol: { fontSize: 28, fontWeight: '900', color: '#001F6D' },
  appName: { fontSize: 22, fontWeight: '300', color: 'rgba(255,255,255,0.85)', letterSpacing: 5, textTransform: 'uppercase' },
  appNameBold: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: 4, textTransform: 'uppercase', marginTop: -4 },
  dividerLine: { width: 50, height: 2, backgroundColor: 'rgba(255,255,255,0.4)', marginVertical: 8 },
  appSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, textTransform: 'uppercase' },

  card: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 26, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 16 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#000000', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#5A6A85', marginBottom: 22, lineHeight: 19 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: '#000000', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 7 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FF', borderRadius: 12, borderWidth: 1.5, borderColor: '#D0DAF0', paddingHorizontal: 14, height: 52 },
  inputWrapperOk: { borderColor: '#00B050' },
  inputWrapperError: { borderColor: '#CC0000' },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#000000', fontWeight: '500', paddingVertical: 0 },
  eyeButton: { padding: 4 },
  eyeIcon: { fontSize: 18 },

  matchText: { fontSize: 12, color: '#00A040', fontWeight: '600', marginTop: 5 },
  mismatchText: { fontSize: 12, color: '#CC0000', fontWeight: '600', marginTop: 5 },

  infoBox: { backgroundColor: '#F0F4FF', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#D0DAF0' },
  infoText: { fontSize: 12, color: '#5A6A85', lineHeight: 18 },

  registerButton: { backgroundColor: '#001F6D', borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center', marginBottom: 14, elevation: 8 },
  registerButtonDisabled: { opacity: 0.5 },
  registerButtonText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1, textTransform: 'uppercase' },

  loginLink: { alignItems: 'center', paddingVertical: 10 },
  loginLinkText: { fontSize: 14, color: '#001F6D', fontWeight: '700' },

  footer: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 24, letterSpacing: 0.5 },
});

export default RegisterScreen;
