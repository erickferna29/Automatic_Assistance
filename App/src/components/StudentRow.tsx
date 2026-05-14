import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSessionStore } from '../store/sessionStore';
import type { SignalStatus } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface StudentRowProps {
  id: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Configuration
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SignalStatus, { color: string; label: string }> = {
  online:  { color: '#00E676', label: 'EN LÍNEA'  },
  idle:    { color: '#FFAB40', label: 'INACTIVO'  },
  offline: { color: '#546E7A', label: 'SIN SEÑAL' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Pure Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * NOTE: relative time is computed at render time from lastSignalAt.
 * It updates whenever the student's signal changes (triggering a re-render)
 * and whenever the decay sweep changes the student's status. This is
 * intentionally coarse — in production you'd add a per-row timer or
 * show absolute timestamps.
 */
function formatRelativeTime(ts: number | null): string {
  if (ts === null) return '—';
  const elapsed = Math.floor((Date.now() - ts) / 1000);
  if (elapsed < 60) return `hace ${elapsed}s`;
  return `hace ${Math.floor(elapsed / 60)}m`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
//
// Two layers of render protection:
//
//   1. React.memo (outer): StudentRow only re-renders if its `id` prop changes.
//      Since IDs in the FlatList are stable strings that never change during a
//      session, this outer memo is mostly a safety net.
//
//   2. Granular Zustand selector (inner): the component subscribes to exactly
//      ONE student object — `state.students[id]`. When signal fires for student A:
//        - store.students['s-001'] ref changes → StudentRow for s-001 re-renders ✓
//        - store.students['s-002'] ref unchanged → StudentRow for s-002 bails out ✓
//      Zustand uses Object.is comparison on the selector return value by default.
//      No shallow comparison needed here because we're selecting a single object.
// ─────────────────────────────────────────────────────────────────────────────

const StudentRow: React.FC<StudentRowProps> = React.memo(({ id }) => {
  // useCallback preserves selector identity across renders of this component.
  // Not strictly required (Zustand compares selector OUTPUT not the fn ref),
  // but it avoids allocating a new closure on every render and makes intent clear.
  const student = useSessionStore(
    useCallback((state) => state.students[id], [id]),
  );

  // Guard: store is always seeded before this renders, but TypeScript requires it.
  if (!student) return null;

  const config = STATUS_CONFIG[student.status];

  return (
    <View style={styles.row}>
      {/* Animated-ready status indicator */}
      <View style={styles.indicatorWrapper}>
        <View style={[styles.indicatorPulse, { backgroundColor: `${config.color}20` }]} />
        <View style={[styles.indicatorDot, { backgroundColor: config.color }]} />
      </View>

      {/* Student Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{student.name}</Text>
        <Text style={styles.timestamp}>
          {'ÚLTIMA SEÑAL  '}
          <Text style={styles.timestampValue}>{formatRelativeTime(student.lastSignalAt)}</Text>
        </Text>
      </View>

      {/* Status Badge */}
      <View style={[styles.badge, { borderColor: `${config.color}60` }]}>
        <Text style={[styles.badgeText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    </View>
  );
});

StudentRow.displayName = 'StudentRow';

export default StudentRow;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const MONO_FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#0D1926',
  },
  indicatorWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  indicatorPulse: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    color: '#C8D8E8',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  timestamp: {
    color: '#2A4A6A',
    fontSize: 10,
    fontFamily: MONO_FONT,
    letterSpacing: 0.8,
    marginTop: 3,
  },
  timestampValue: {
    color: '#4A6A8A',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#0A1520',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    fontFamily: MONO_FONT,
  },
});
