import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

const PermissionsDeniedScreen = ({ navigation }) => {
  const openSettings = () => {
    Linking.openSettings();
  };

  const goBack = () => {
    navigation.navigate('Login');
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

      {/* Contenido centrado */}
      <View style={styles.content}>
        {/* Icono de bloqueo */}
        <View style={styles.blockIcon}>
          <Text style={styles.blockEmoji}>🔐</Text>
          <View style={styles.blockBadge}>
            <Text style={styles.blockBadgeText}>✕</Text>
          </View>
        </View>

        <Text style={styles.title}>Acceso Restringido</Text>

        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>
            Permisos Necesarios para Continuar
          </Text>
          <Text style={styles.messageBody}>
            La aplicación{' '}
            <Text style={styles.appNameInline}>Automatic Assistence</Text>{' '}
            requiere acceso a los servicios de{' '}
            <Text style={styles.highlight}>Bluetooth</Text> y{' '}
            <Text style={styles.highlight}>Cámara</Text> para funcionar
            correctamente.
          </Text>

          <View style={styles.reasonsBox}>
            <View style={styles.reasonRow}>
              <Text style={styles.reasonEmoji}>📡</Text>
              <Text style={styles.reasonText}>
                <Text style={styles.reasonBold}>Bluetooth:</Text> Envío de señal
                de asistencia al sistema receptor.
              </Text>
            </View>
            <View style={styles.reasonDivider} />
            <View style={styles.reasonRow}>
              <Text style={styles.reasonEmoji}>📷</Text>
              <Text style={styles.reasonText}>
                <Text style={styles.reasonBold}>Cámara:</Text> Verificación y
                registro de identidad del usuario.
              </Text>
            </View>
          </View>

          <Text style={styles.instructionTitle}>
            ¿Cómo habilitar los permisos?
          </Text>
          <Text style={styles.instructionText}>
            Ve a <Text style={styles.highlight}>Configuración</Text> de tu
            dispositivo → <Text style={styles.highlight}>Aplicaciones</Text> →{' '}
            <Text style={styles.highlight}>Automatic Assistence</Text> →{' '}
            <Text style={styles.highlight}>Permisos</Text> y activa Cámara y
            Bluetooth.
          </Text>
        </View>

        {/* Botones */}
        <TouchableOpacity
          style={styles.btnSettings}
          onPress={openSettings}
          activeOpacity={0.85}>
          <Text style={styles.btnSettingsText}>⚙️ Abrir Configuración</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnBack}
          onPress={goBack}
          activeOpacity={0.7}>
          <Text style={styles.btnBackText}>← Regresar al Inicio</Text>
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

  // ── HEADER
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
  },

  // ── CONTENIDO
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
    alignItems: 'center',
  },

  // ── ICONO BLOQUEO
  blockIcon: {
    position: 'relative',
    marginBottom: 20,
  },
  blockEmoji: {
    fontSize: 80,
  },
  blockBadge: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#CC0000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  blockBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.5,
  },

  // ── CARD DE MENSAJE
  messageCard: {
    width: '100%',
    backgroundColor: '#0A0A1A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E1E3E',
    marginBottom: 24,
  },
  messageTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  messageBody: {
    fontSize: 13,
    color: '#8A9BB5',
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 16,
  },
  appNameInline: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  highlight: {
    color: '#4A90FF',
    fontWeight: '700',
  },

  // ── RAZONES
  reasonsBox: {
    backgroundColor: '#050515',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#151530',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  reasonEmoji: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 1,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    color: '#8A9BB5',
    lineHeight: 20,
  },
  reasonBold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reasonDivider: {
    height: 1,
    backgroundColor: '#1E1E3E',
    marginVertical: 4,
  },

  // ── INSTRUCCIONES
  instructionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 12,
    color: '#6A7B9E',
    lineHeight: 19,
  },

  // ── BOTONES
  btnSettings: {
    width: '100%',
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
  btnSettingsText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  btnBack: {
    paddingVertical: 14,
  },
  btnBackText: {
    fontSize: 14,
    color: '#555577',
    fontWeight: '600',
  },
});

export default PermissionsDeniedScreen;
