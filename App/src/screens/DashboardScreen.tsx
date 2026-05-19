import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  type ListRenderItemInfo,
} from 'react-native';
import { useSessionStore } from '../store/sessionStore';
import StudentRow from '../components/StudentRow';
import type { Profesor, Materia } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Navigation Props
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardScreenProps {
  navigation: any;
  route: {
    params: {
      profesor: Profesor;
    };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FlatList helpers — definidos fuera del componente para evitar re-renders
// ─────────────────────────────────────────────────────────────────────────────

const renderStudentRow = ({ item }: ListRenderItemInfo<string>) => (
  <StudentRow id={item} />
);

const keyExtractor = (id: string) => id;

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation, route }) => {
  const profesor = route?.params?.profesor;

  if (!profesor) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Sin datos de profesor</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={{ color: '#00E676', marginTop: 12 }}>Volver al Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Zustand selectors ──
  const isSessionActive = useSessionStore(state => state.isSessionActive);
  const isLoading       = useSessionStore(state => state.isLoading);
  const error           = useSessionStore(state => state.error);
  const studentIds      = useSessionStore(state => state.studentIds);
  const startSession    = useSessionStore(state => state.startSession);
  const endSession      = useSessionStore(state => state.endSession);

  const onlineCount = useSessionStore(
    useCallback(
      state => state.studentIds.filter(id => state.students[id]?.status === 'online').length,
      []
    )
  );

  // ── Materia seleccionada ──
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(
    profesor.materias?.length === 1 ? profesor.materias[0] : null
  );

  // ── Handlers ──
  const handleStartSession = () => {
    if (profesor.materias?.length === 0) {
      Alert.alert('Sin materias', 'Este profesor no tiene materias asignadas en el sistema.');
      return;
    }

    if (!selectedMateria && profesor.materias?.length > 1) {
      Alert.alert(
        'Selecciona una materia',
        'Elige la materia para esta sesión:',
        profesor.materias.map((m: Materia) => ({
          text: m.nombre_materia,
          onPress: () => {
            setSelectedMateria(m);
            startSession(profesor.no_empleado, m.codigo_materia);
          },
        }))
      );
      return;
    }

    const materia = selectedMateria ?? profesor.materias?.[0];
    if (materia) startSession(profesor.no_empleado, materia.codigo_materia);
  };

  // Cierra SOLO la sesión de clase — el profesor se queda en el Dashboard
  const handleEndSession = async () => {
    Alert.alert(
      'Cerrar sesión de clase',
      '¿Confirmas que deseas finalizar la sesión de clase?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'destructive',
          onPress: async () => {
            await endSession();
            // No navega — el profesor sigue en el Dashboard
          },
        },
      ]
    );
  };

  // Cierra sesión del usuario y regresa al Login
  const handleLogout = async () => {
    if (isSessionActive) {
      // Si hay sesión de clase activa, la cerramos antes de salir
      await endSession();
    }
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const totalCount = studentIds.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#070E17" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerEyebrow}>MONITOR DE PRESENCIA</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {profesor.nombre_profesor}
          </Text>
          {selectedMateria && (
            <Text style={styles.headerMateria}>{selectedMateria.nombre_materia}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {/* Botón salir — cierra sesión de usuario */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>SALIR →</Text>
          </TouchableOpacity>
          {/* Pill de estado de sesión de clase */}
          <View style={[styles.sessionPill, isSessionActive && styles.sessionPillActive]}>
            <View style={[styles.sessionDot, isSessionActive && styles.sessionDotActive]} />
            <Text style={[styles.sessionPillText, isSessionActive && styles.sessionPillTextActive]}>
              {isSessionActive ? 'ACTIVA' : 'INACTIVA'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Stats Bar ── */}
      {isSessionActive && (
        <View style={styles.statsBar}>
          <View style={styles.statCell}>
            <Text style={[styles.statValue, styles.statValueDefault]}>{totalCount}</Text>
            <Text style={styles.statLabel}>ALUMNOS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={[styles.statValue, styles.statValueOnline]}>{onlineCount}</Text>
            <Text style={styles.statLabel}>EN LÍNEA</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={[styles.statValue, styles.statValueIdle]}>{totalCount - onlineCount}</Text>
            <Text style={styles.statLabel}>INACTIVOS</Text>
          </View>
        </View>
      )}

      {/* ── Feedback: loading / error ── */}
      {isLoading && (
        <View style={styles.feedbackBox}>
          <ActivityIndicator color="#00E676" size="small" />
          <Text style={styles.feedbackText}>  Cargando alumnos desde el servidor...</Text>
        </View>
      )}
      {!!error && (
        <View style={[styles.feedbackBox, styles.feedbackError]}>
          <Text style={styles.feedbackText}>⚠  {error}</Text>
        </View>
      )}

      {/* ── Session Controls ── */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnStart, isSessionActive && styles.btnDisabled]}
          onPress={handleStartSession}
          disabled={isSessionActive || isLoading}
          activeOpacity={0.75}
        >
          <Text style={styles.btnText}>▶  LEVANTAR SESIÓN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnEnd, !isSessionActive && styles.btnDisabled]}
          onPress={handleEndSession}
          disabled={!isSessionActive}
          activeOpacity={0.75}
        >
          <Text style={styles.btnText}>■  CERRAR SESIÓN</Text>
        </TouchableOpacity>
      </View>

      {/* ── Student List / Empty State ── */}
      {isSessionActive ? (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>ALUMNOS REGISTRADOS</Text>
            <Text style={styles.listHeaderCount}>{totalCount}</Text>
          </View>
          <FlatList
            data={studentIds}
            renderItem={renderStudentRow}
            keyExtractor={keyExtractor}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            windowSize={5}
            maxToRenderPerBatch={10}
            initialNumToRender={10}
            removeClippedSubviews={true}
          />
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyGlyph}>⬡</Text>
          <Text style={styles.emptyTitle}>Sin sesión activa</Text>
          <Text style={styles.emptyBody}>
            Levanta una sesión para comenzar{'\n'}el monitoreo de presencia.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default DashboardScreen;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const MONO_FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070E17' },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#0D1926',
  },
  headerEyebrow: {
    color: '#1E3A52', fontSize: 10,
    fontFamily: MONO_FONT, letterSpacing: 2.5, marginBottom: 4,
  },
  headerTitle: {
    color: '#C8D8E8', fontSize: 18, fontWeight: '700', letterSpacing: -0.3,
  },
  headerMateria: {
    color: '#4A6A8A', fontSize: 12, fontFamily: MONO_FONT, marginTop: 3,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3D0060',
    backgroundColor: '#1A000005',
  },
  logoutBtnText: {
    color: '#FF3D00',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: MONO_FONT,
    letterSpacing: 1,
  },
  sessionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#1A2E3F', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#0A1520',
  },
  sessionPillActive:     { borderColor: '#00E67650', backgroundColor: '#00E67612' },
  sessionDot:            { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1E3A52' },
  sessionDotActive:      { backgroundColor: '#00E676' },
  sessionPillText:       { color: '#1E3A52', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, fontFamily: MONO_FONT },
  sessionPillTextActive: { color: '#00E676' },

  statsBar: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 16,
    borderWidth: 1, borderColor: '#0D1926', borderRadius: 10,
    backgroundColor: '#0A1520', overflow: 'hidden',
  },
  statCell:         { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  statDivider:      { width: 1, backgroundColor: '#0D1926' },
  statValue:        { fontSize: 26, fontWeight: '700', letterSpacing: -1 },
  statValueDefault: { color: '#C8D8E8' },
  statValueOnline:  { color: '#00E676' },
  statValueIdle:    { color: '#FFAB40' },
  statLabel:        { color: '#1E3A52', fontSize: 9, letterSpacing: 2, fontFamily: MONO_FONT, marginTop: 3 },

  feedbackBox: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginTop: 10, padding: 12,
    borderRadius: 8, backgroundColor: '#0A1520',
    borderWidth: 1, borderColor: '#0D1926',
  },
  feedbackError: { borderColor: '#FF3D0050', backgroundColor: '#1A0A0A' },
  feedbackText:  { color: '#4A6A8A', fontSize: 12, fontFamily: MONO_FONT },

  controlsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  btn:         { flex: 1, paddingVertical: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  btnStart:    { backgroundColor: '#00261300', borderColor: '#00E67680' },
  btnEnd:      { backgroundColor: '#26000000', borderColor: '#FF3D0080' },
  btnDisabled: { opacity: 0.25 },
  btnText:     { color: '#C8D8E8', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, fontFamily: MONO_FONT },

  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#0D1926',
  },
  listHeaderText:  { color: '#1E3A52', fontSize: 10, fontFamily: MONO_FONT, letterSpacing: 2 },
  listHeaderCount: { color: '#2A5070', fontSize: 10, fontFamily: MONO_FONT },
  list:            { flex: 1 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100, gap: 10 },
  emptyGlyph: { fontSize: 52, color: '#0D1926', marginBottom: 8 },
  emptyTitle: { color: '#1E3A52', fontSize: 18, fontWeight: '600' },
  emptyBody:  { color: '#162840', fontSize: 13, textAlign: 'center', lineHeight: 22, fontFamily: MONO_FONT },
});
