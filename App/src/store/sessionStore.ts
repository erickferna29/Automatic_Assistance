import { create } from 'zustand';
import type { SessionStore, Student, SignalStatus } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Mock Seed Data
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_ROSTER: Omit<Student, 'status'>[] = [
  { id: 's-001', name: 'Ana García Ramos',       lastSignalAt: null },
  { id: 's-002', name: 'Carlos López Díaz',       lastSignalAt: null },
  { id: 's-003', name: 'Sofía Martínez Cruz',     lastSignalAt: null },
  { id: 's-004', name: 'Miguel Hernández Vega',   lastSignalAt: null },
  { id: 's-005', name: 'Laura Jiménez Flores',    lastSignalAt: null },
  { id: 's-006', name: 'Diego Torres Muñoz',      lastSignalAt: null },
  { id: 's-007', name: 'Valeria Romero Silva',    lastSignalAt: null },
  { id: 's-008', name: 'Andrés Castillo Ruiz',    lastSignalAt: null },
  { id: 's-009', name: 'Isabela Moreno Peña',     lastSignalAt: null },
  { id: 's-010', name: 'Rafael Núñez Vargas',     lastSignalAt: null },
];

// ─────────────────────────────────────────────────────────────────────────────
// Timing Configuration
// In production: SIGNAL_TICK_MS = 300_000 (5 min). Mock is accelerated 200x.
// ─────────────────────────────────────────────────────────────────────────────

const SIGNAL_TICK_MS  = 1_500;  // Interval between random mock signals
const DECAY_TICK_MS   = 2_000;  // How often decay sweep runs
const ONLINE_WINDOW_MS = 5_000; // < 5s since last signal → online
const IDLE_WINDOW_MS  = 12_000; // 5–12s → idle; > 12s → offline

// ─────────────────────────────────────────────────────────────────────────────
// Module-Level Interval Refs
//
// WHY NOT in Zustand state?
//   1. Interval IDs are not serializable — they break the assumption that store
//      state can be snapshot/replayed (e.g. devtools, SSR, persistence).
//   2. Storing them in state means every subscriber re-renders when they change,
//      which includes StudentRow × 10 on every startSession/endSession call.
//   3. They are infrastructure, not application state. The app never needs to
//      "react" to the interval ID changing — it only cares about the effects.
// ─────────────────────────────────────────────────────────────────────────────

let _signalInterval: ReturnType<typeof setInterval> | null = null;
let _decayInterval:  ReturnType<typeof setInterval> | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// Pure Helpers
// ─────────────────────────────────────────────────────────────────────────────

function deriveStatus(lastSignalAt: number | null): SignalStatus {
  if (lastSignalAt === null) return 'offline';
  const elapsed = Date.now() - lastSignalAt;
  if (elapsed < ONLINE_WINDOW_MS) return 'online';
  if (elapsed < IDLE_WINDOW_MS)   return 'idle';
  return 'offline';
}

function buildInitialStudents(): Record<string, Student> {
  return MOCK_ROSTER.reduce<Record<string, Student>>((acc, s) => {
    acc[s.id] = { ...s, status: 'offline' };
    return acc;
  }, {});
}

function buildResetStudents(
  current: Record<string, Student>,
): Record<string, Student> {
  return Object.fromEntries(
    Object.entries(current).map(([id, s]) => [
      id,
      { ...s, lastSignalAt: null, status: 'offline' as SignalStatus },
    ]),
  );
}

function clearIntervals(): void {
  if (_signalInterval !== null) { clearInterval(_signalInterval); _signalInterval = null; }
  if (_decayInterval  !== null) { clearInterval(_decayInterval);  _decayInterval  = null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useSessionStore = create<SessionStore>((set, get) => ({
  isSessionActive: false,
  studentIds:      MOCK_ROSTER.map(s => s.id),
  students:        buildInitialStudents(),

  startSession: () => {
    if (_signalInterval !== null) return; // Idempotency guard

    set({ isSessionActive: true });

    // ── Signal Emitter ────────────────────────────────────────────────────────
    // Randomly picks one student and delivers a signal (updates lastSignalAt + status).
    // The spread `{ ...state.students, [id]: newObj }` creates a new top-level
    // students object but PRESERVES object references for every OTHER student.
    // This is the core of the O(1) isolation guarantee:
    //   - StudentRow for the updated student: new object ref → re-render ✓
    //   - Every other StudentRow: same object ref → React.memo bails out ✓
    _signalInterval = setInterval(() => {
      const { studentIds } = get();
      const id  = studentIds[Math.floor(Math.random() * studentIds.length)];
      const now = Date.now();

      set(state => ({
        students: {
          ...state.students,
          [id]: {
            ...state.students[id],
            lastSignalAt: now,
            status: 'online' as SignalStatus,
          },
        },
      }));
    }, SIGNAL_TICK_MS);

    // ── Decay Sweep ───────────────────────────────────────────────────────────
    // Periodically re-derives status for every student based on elapsed time.
    // CRITICAL: only calls set() when at least one status actually changed.
    // If we called set() unconditionally, every tick would push a new state
    // reference and re-render all subscribers — defeating the entire architecture.
    _decayInterval = setInterval(() => {
      const { students } = get();
      let dirty = false;
      const next: Record<string, Student> = { ...students };

      for (const id in next) {
        const derived = deriveStatus(next[id].lastSignalAt);
        if (derived !== next[id].status) {
          next[id] = { ...next[id], status: derived };
          dirty = true;
        }
      }

      if (dirty) set({ students: next });
    }, DECAY_TICK_MS);
  },

  endSession: () => {
    clearIntervals();
    set(state => ({
      isSessionActive: false,
      students: buildResetStudents(state.students),
    }));
  },
}));
