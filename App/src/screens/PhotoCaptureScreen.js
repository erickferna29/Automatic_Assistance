import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import { subirFoto } from '../services/api';

const PhotoCaptureScreen = ({ navigation, route }) => {
  const { usuario } = route.params;
  const cameraRef = useRef(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;

    setCapturing(true);
    try {
      const options = {
        quality: 0.8,           // Calidad 0-1 (0.8 = buena calidad con tamaño razonable)
        base64: false,          // No necesitamos base64, usamos URI
        fixOrientation: true,   // Corregir orientación automáticamente
        forceUpOrientation: true,
      };

      const data = await cameraRef.current.takePictureAsync(options);
      setPhotoUri(data.uri);
    } catch (error) {
      Alert.alert('Error', 'No se pudo capturar la foto. Intenta de nuevo.');
    } finally {
      setCapturing(false);
    }
  };

  const retakePhoto = () => {
    setPhotoUri(null);
  };

  const confirmAndUpload = async () => {
    if (!photoUri) return;

    setUploading(true);
    try {
      // Subir foto al servidor
      const resultado = await subirFoto(usuario.id, photoUri);

      if (resultado.success) {
        // Foto subida exitosamente → ir a Bienvenida
        navigation.navigate('Welcome', { usuario });
      } else {
        Alert.alert('Error', resultado.message || 'No se pudo guardar la foto.');
      }
    } catch (error) {
      Alert.alert(
        'Error de conexión',
        error.message + '\n\nVerifica que el servidor esté disponible.',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.logoSmall}>
          <Text style={styles.logoSmallText}>A</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>Registro de Foto</Text>
          <Text style={styles.headerSubtitle}>Automatic Assistence</Text>
        </View>
      </View>

      {/* Instrucciones */}
      <View style={styles.instructionsBar}>
        <Text style={styles.instructionsText}>
          {!photoUri
            ? '📸 Centra tu rostro y toma la foto'
            : '✅ Verifica que tu foto sea clara antes de confirmar'}
        </Text>
      </View>

      {/* Área de cámara o preview */}
      <View style={styles.cameraContainer}>
        {!photoUri ? (
          // Vista de cámara en vivo
          <RNCamera
            ref={cameraRef}
            style={styles.camera}
            type={RNCamera.Constants.Type.front}  // Cámara frontal para selfie
            captureAudio={false}
            androidCameraPermissionOptions={{
              title: 'Permiso de Cámara',
              message: 'Automatic Assistence necesita acceso a tu cámara.',
              buttonPositive: 'Permitir',
              buttonNegative: 'Cancelar',
            }}>
            {/* Marco guía para el rostro */}
            <View style={styles.faceGuide}>
              <View style={styles.faceGuideCornerTL} />
              <View style={styles.faceGuideCornerTR} />
              <View style={styles.faceGuideCornerBL} />
              <View style={styles.faceGuideCornerBR} />
              <Text style={styles.faceGuideText}>Coloca tu rostro aquí</Text>
            </View>
          </RNCamera>
        ) : (
          // Preview de la foto tomada
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        )}
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        {!photoUri ? (
          // Botón de captura
          <View style={styles.captureRow}>
            <View style={styles.captureHint}>
              <Text style={styles.captureHintText}>
                Usuario:{'\n'}
                <Text style={styles.captureHintName}>
                  {usuario?.nombre || 'N/A'}
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.captureButton, capturing && styles.captureButtonActive]}
              onPress={takePicture}
              disabled={capturing}
              activeOpacity={0.8}>
              {capturing ? (
                <ActivityIndicator color="#001F6D" size="large" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>

            <View style={styles.captureHint} />
          </View>
        ) : (
          // Botones después de capturar
          <View style={styles.confirmRow}>
            <TouchableOpacity
              style={styles.btnRetake}
              onPress={retakePhoto}
              disabled={uploading}
              activeOpacity={0.8}>
              <Text style={styles.btnRetakeText}>🔄 Retomar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnConfirm, uploading && styles.btnDisabled]}
              onPress={confirmAndUpload}
              disabled={uploading}
              activeOpacity={0.85}>
              {uploading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.btnConfirmText}>✓ Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {uploading && (
          <Text style={styles.uploadingText}>
            Subiendo foto al servidor...
          </Text>
        )}
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
    marginRight: 12,
  },
  logoSmallText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#001F6D',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },

  // ── INSTRUCCIONES
  instructionsBar: {
    backgroundColor: '#050520',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#0D0D30',
  },
  instructionsText: {
    fontSize: 13,
    color: '#8A9BB5',
    textAlign: 'center',
    fontWeight: '500',
  },

  // ── CÁMARA
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreview: {
    flex: 1,
    resizeMode: 'cover',
  },

  // ── GUÍA DE ROSTRO
  faceGuide: {
    width: 220,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  faceGuideCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 36,
    height: 36,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
    borderTopLeftRadius: 4,
  },
  faceGuideCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFFFFF',
    borderTopRightRadius: 4,
  },
  faceGuideCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 36,
    height: 36,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  faceGuideCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFFFFF',
    borderBottomRightRadius: 4,
  },
  faceGuideText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    position: 'absolute',
    bottom: -28,
  },

  // ── CONTROLES
  controls: {
    backgroundColor: '#050520',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#0D0D30',
    minHeight: 110,
    alignItems: 'center',
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  captureHint: {
    flex: 1,
    alignItems: 'center',
  },
  captureHintText: {
    fontSize: 11,
    color: '#555577',
    textAlign: 'center',
    lineHeight: 16,
  },
  captureHintName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },

  // Botón captura circular
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#001F6D',
    shadowColor: '#001F6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  captureButtonActive: {
    borderColor: '#4488FF',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#001F6D',
  },

  // ── CONFIRMAR / RETOMAR
  confirmRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btnRetake: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0D0D30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E4E',
  },
  btnRetakeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8A9BB5',
  },
  btnConfirm: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#001F6D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#001F6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnConfirmText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  uploadingText: {
    fontSize: 12,
    color: '#8A9BB5',
    marginTop: 10,
  },
});

export default PhotoCaptureScreen;
