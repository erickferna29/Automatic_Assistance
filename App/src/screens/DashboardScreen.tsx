import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  type ListRenderItemInfo,
} from 'react-native';
import { useSessionStore } from '../store/sessionStore';
import StudentRow from '../components/StudentRow';

// ─────────────────────────────────────────────────────────────────────────────
// FlatList Render Helpers — Defined OUTSIDE the component
//
// WHY OUTSIDE? If defined inside DashboardScreen, these functions are
// re-allocated on every render of the screen. FlatList receives a new
// `renderItem` reference → internal shouldComponentUpdate fails →
// ALL item rows re-render. This is one of the most common FlatList
// performance pitfalls in production React Native apps.
// ─────────────────────────────────────────────────────────────────────────────

const renderStudentRow = ({ item }: ListRenderItemInfo<string>) => (
  <StudentRow id={item} />
);

const keyExtractor = (id: string) => id;

// ─────────────────────────────────────────────────────────────────────────────
// Stats Selector
//
// ⚠️ KNOWN TRADEOFF: This derived value (onlineCount) forces a DashboardScreen
// re-render whenever ANY student changes status. For a 10-student mock, this is
// acceptable. At scale (100+ students), move this to a dedicated <StatsBar />
// component with its own selector, or maintain `onlineCount` as a derived value
// in the store (updated incrementally in startSession's set calls).
// ─────────────────────────────────────────────────────────────────────────────

const selectOnlineCount = (state: {
  studentIds: string[];
  students: Record<string, { status: string }>;
}) =>
  state.studentIds.filter(id => state.students[id]?.status === 'online').length;

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

const DashboardScreen: React.FC = () => {
  const isSessionActive = useSessionStore(state => state.isSessionActive);
  const studentIds      = useSessionStore(state => state.studentIds);
  const startSession    = useSessionStore(state => state.startSession);
  const endSession      = useSessionStore(state => state.endSession);
  const onlineCount     = useSessionStore(selectOnlineCount);
  const totalCount      = studentIds.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#070E17" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>MONITOR DE PRESENCIA</Text>
          <Text style={styles.headerTitle}>Dashboard Docente</Text>
        </View>
        <View style={[
          styles.sessionPill,
          isSessionActive && styles.sessionPillActive,
        ]}>
          <View style={[
            styles.sessionDot,
            isSessionActive && styles.sessionDotActive,
          ]} />
          <Text style={[
            styles.sessionPillText,
            isSessionActive && styles.sessionPillTextActive,
          ]}>
            {isSessionActive ? 'SESIÓN ACTIVA' : 'SIN SESIÓN'}
          </Text>
        </View>
      </View>

      {/* ── Stats Bar — only visible when session is active ── */}
      {isSessionActive && (
        <View style={styles.statsBar}>
          <StatCell
            value={totalCount}
            label="ALUMNOS"
            valueStyle={styles.statValueDefault}
          />
          <View style={styles.statDivider} />
          <StatCell
            value={onlineCount}
            label="EN LÍNEA"
            valueStyle={styles.statValueOnline}
          />
          <View style={styles.statDivider} />
          <StatCell
            value={totalCount - onlineCount}
            label="INACTIVOS"
            valueStyle={styles.statValueIdle}
          />
        </View>
      )}

      {/* ── Session Controls ── */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnStart, isSessionActive  && styles.btnDisabled]}
          onPress={startSession}
          disabled={isSessionActive}
          activeOpacity={0.75}
        >
          <Text style={styles.btnText}>▶  LEVANTAR SESIÓN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnEnd, !isSessionActive && styles.btnDisabled]}
          onPress={endSession}
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
            data={studentIds}        // ← ONLY IDs. FlatList never re-renders on signal updates.
            renderItem={renderStudentRow}
            keyExtractor={keyExtractor}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            // Tuned for typical classroom size (10–50 students)
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
            Levanta una sesión para comenzar{'\n'}el monitoreo de presencia en tiempo real.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface StatCellProps {
  value: number;
  label: string;
  valueStyle: object;
}

const StatCell: React.FC<StatCellProps> = ({ value, label, valueStyle }) => (
  <View style={styles.statCell}>
    <Text style={[styles.statValue, valueStyle]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default DashboardScreen;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const MONO_FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#070E17',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#0D1926',
  },
  headerEyebrow: {
    color: '#1E3A52',
    fontSize: 10,
    fontFamily: MONO_FONT,
    letterSpacing: 2.5,
    marginBottom: 5,
  },
  headerTitle: {
    color: '#C8D8E8',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1A2E3F',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#0A1520',
  },
  sessionPillActive: {
    borderColor: '#00E67650',
    backgroundColor: '#00E67612',
  },
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E3A52',
  },
  sessionDotActive: {
    backgroundColor: '#00E676',
  },
  sessionPillText: {
    color: '#1E3A52',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: MONO_FONT,
  },
  sessionPillTextActive: {
    color: '#00E676',
  },

  // ── Stats Bar ──
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#0D1926',
    borderRadius: 10,
    backgroundColor: '#0A1520',
    overflow: 'hidden',
  },
  statCell: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#0D1926',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -1,
  },
  statValueDefault: { color: '#C8D8E8' },
  statValueOnline:  { color: '#00E676' },
  statValueIdle:    { color: '#FFAB40' },
  statLabel: {
    color: '#1E3A52',
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: MONO_FONT,
    marginTop: 3,
  },

  // ── Controls ──
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnStart: {
    backgroundColor: '#00261300',
    borderColor: '#00E67680',
  },
  btnEnd: {
    backgroundColor: '#26000000',
    borderColor: '#FF3D0080',
  },
  btnDisabled: {
    opacity: 0.25,
  },
  btnText: {
    color: '#C8D8E8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: MONO_FONT,
  },

  // ── List ──
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0D1926',
  },
  listHeaderText: {
    color: '#1E3A52',
    fontSize: 10,
    fontFamily: MONO_FONT,
    letterSpacing: 2,
  },
  listHeaderCount: {
    color: '#2A5070',
    fontSize: 10,
    fontFamily: MONO_FONT,
  },
  list: {
    flex: 1,
  },

  // ── Empty State ──
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
    gap: 10,
  },
  emptyGlyph: {
    fontSize: 52,
    color: '#0D1926',
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#1E3A52',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyBody: {
    color: '#162840',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: MONO_FONT,
  },
});
